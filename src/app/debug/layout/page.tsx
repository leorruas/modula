'use client';

import { useState, useEffect } from 'react';
import { VisualLayoutDebugger } from '@/features/charts/components/VisualLayoutDebugger';
import { ChartData, GridConfig } from '@/types';

export default function EnhancedDebugPage() {
    // State
    const [chartType, setChartType] = useState('bar');
    const [width, setWidth] = useState(600);
    const [height, setHeight] = useState(400);
    const [dataPoints, setDataPoints] = useState(5);
    const [labelLength, setLabelLength] = useState('short'); // short, medium, long
    const [showOverlay, setShowOverlay] = useState(true);

    // Infographic State
    const [heroIndex, setHeroIndex] = useState<number>(-1);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [showDelta, setShowDelta] = useState(false);
    const [showExtremes, setShowExtremes] = useState(false);
    const [useMetadata, setUseMetadata] = useState(false);
    const [legendPos, setLegendPos] = useState<'top' | 'bottom' | 'left' | 'right' | 'none'>('top');
    const [labelLayout, setLabelLayout] = useState<'radial' | 'column-left' | 'column-right' | 'balanced' | undefined>(undefined);

    const [chartData, setChartData] = useState<ChartData | null>(null);

    // Grid Config (Memoized to prevent unnecessary re-calcs)
    const gridConfig: GridConfig = {
        baseFontSize: 12,
        columns: 12,
        rows: 8,
        gutter: 16,
        margin: 20,
        pageFormat: 'A4',
        orientation: 'landscape',
        width: 297,
        height: 210
    };

    // Data Generation Logic (Client-Side Only via Effect)
    useEffect(() => {
        const labels = Array.from({ length: dataPoints }).map((_, i) => {
            if (labelLength === 'long') return `Very Long Category Label ${i + 1} with Extra Details`;
            if (labelLength === 'medium') return `Medium Label ${i + 1}`;
            return `Item ${i + 1}`;
        });

        // Use Math.random() only on client
        const data = Array.from({ length: dataPoints }).map(() => Math.floor(Math.random() * 100));

        // Generate mock metadata if enabled
        const metadata = useMetadata ? Array.from({ length: dataPoints }).map((_, i) => i % 2 === 0 ? "META" : "") : undefined;

        setChartData({
            labels,
            datasets: [{
                label: 'Test Dataset',
                data,
                backgroundColor: '#3b82f6',
                metadata
            } as any]
        });
    }, [dataPoints, labelLength, useMetadata]); // Re-run when config changes

    // Loading state to prevent hydration mismatch on first render
    if (!chartData) {
        return <div className="p-8 flex items-center justify-center min-h-screen">Loading Debugger...</div>;
    }

    return (
        <div className="p-8 space-y-8 bg-white min-h-screen">
            <header>
                <h1 className="text-2xl font-bold mb-2">Visual Layout Debugger</h1>
                <p className="text-gray-600">Visualize unseen layout boundaries safe zones and margins.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Panel */}
                <div className="space-y-6 bg-gray-50 p-6 rounded-lg shadow-sm h-fit border">
                    <h2 className="font-semibold text-lg border-b pb-2">Configuration</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Chart Type</label>
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                            >
                                <option value="bar">Bar Chart</option>
                                <option value="column">Column Chart</option>
                                <option value="pie">Pie Chart</option>
                                <option value="donut">Donut Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="area">Area Chart</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Container Size ({width}x{height})</label>
                            <div className="flex gap-4 items-center">
                                <span className="text-xs text-gray-500 w-8">W:</span>
                                <input
                                    type="range" min="300" max="1200" step="10"
                                    value={width} onChange={(e) => setWidth(Number(e.target.value))}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-4 items-center mt-2">
                                <span className="text-xs text-gray-500 w-8">H:</span>
                                <input
                                    type="range" min="200" max="800" step="10"
                                    value={height} onChange={(e) => setHeight(Number(e.target.value))}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Data Volume: {dataPoints}</label>
                            <input
                                type="range" min="1" max="50"
                                value={dataPoints} onChange={(e) => setDataPoints(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Label Length</label>
                            <div className="flex gap-2">
                                {['short', 'medium', 'long'].map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setLabelLength(l)}
                                        className={`px-3 py-1 rounded text-xs border ${labelLength === l ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white'}`}
                                    >
                                        {l.charAt(0).toUpperCase() + l.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Infographic Controls */}
                        <div className="pt-4 border-t space-y-3">
                            <h3 className="font-semibold text-sm text-gray-700">Infographic Options</h3>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={showAnnotations} onChange={e => setShowAnnotations(e.target.checked)} />
                                    <span>Annotations</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={showDelta} onChange={e => setShowDelta(e.target.checked)} />
                                    <span>Delta %</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={showExtremes} onChange={e => setShowExtremes(e.target.checked)} />
                                    <span>Extremes</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={useMetadata} onChange={e => setUseMetadata(e.target.checked)} />
                                    <span>Metadata</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Hero Index (-1 none)</label>
                                    <input
                                        type="number" min="-1" max={dataPoints}
                                        value={heroIndex} onChange={e => setHeroIndex(Number(e.target.value))}
                                        className="w-full border rounded p-1 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Legend</label>
                                    <select value={legendPos} onChange={e => setLegendPos(e.target.value as any)} className="w-full border rounded p-1 text-sm">
                                        <option value="top">Top</option>
                                        <option value="bottom">Bottom</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                        <option value="none">None</option>
                                    </select>
                                </div>
                            </div>

                            {['pie', 'donut'].includes(chartType) && (
                                <div>
                                    <label className="block text-xs font-medium mb-1">Label Layout</label>
                                    <select value={labelLayout || 'radial'} onChange={e => setLabelLayout(e.target.value as any)} className="w-full border rounded p-1 text-sm">
                                        <option value="radial">Radial</option>
                                        <option value="column-left">Column Left</option>
                                        <option value="column-right">Column Right</option>
                                        <option value="balanced">Balanced</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showOverlay}
                                        onChange={(e) => setShowOverlay(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="font-medium text-gray-900">Show Overlay</span>
                                </label>
                            </div>

                            <button
                                onClick={() => {
                                    const newValues = Array.from({ length: dataPoints }).map(() => Math.floor(Math.random() * 100));
                                    if (chartData) {
                                        setChartData({
                                            ...chartData,
                                            datasets: [{
                                                ...chartData.datasets[0],
                                                data: newValues
                                            }]
                                        });
                                    }
                                }}
                                className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium text-blue-700"
                            >
                                🎲 Randomize Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow-sm flex items-center justify-center overflow-auto">
                    <VisualLayoutDebugger
                        type={chartType}
                        data={chartData}
                        gridConfig={gridConfig}
                        width={width}
                        height={height}
                        style={{
                            mode: 'infographic', // Default to infographic for this debugger
                            colorPalette: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                            infographicConfig: {
                                heroValueIndex: heroIndex >= 0 ? heroIndex : undefined,
                                showValueAnnotations: showAnnotations,
                                showDeltaPercent: showDelta,
                                showExtremes: showExtremes,
                                useMetadata: useMetadata,
                                legendPosition: legendPos,
                                labelLayout: labelLayout
                            }
                        } as any}
                        showOverlay={showOverlay}
                    />
                </div>
            </div>
        </div>
    );
}
