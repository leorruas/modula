import React, { useMemo } from 'react';
import { SmartLayoutEngine } from '@/services/smartLayout/SmartLayoutEngine';
import { ChartData, ChartStyle, GridConfig } from '@/types';
import { BarChart } from './BarChart';
import { ColumnChart } from './ColumnChart';
import { PieChart } from './PieChart';
import { DonutChart } from './DonutChart';
import { LineChart } from './LineChart';
import { AreaChart } from './AreaChart';

interface VisualLayoutDebuggerProps {
    type: string;
    data: ChartData;
    style?: ChartStyle;
    gridConfig: GridConfig;
    width: number;
    height: number;
    showOverlay?: boolean;
}

export function VisualLayoutDebugger({
    type,
    data,
    style,
    gridConfig,
    width,
    height,
    showOverlay = true
}: VisualLayoutDebuggerProps) {
    // 1. Compute Layout
    const layout = useMemo(() => {
        return SmartLayoutEngine.computeLayout(
            { type, data, style },
            gridConfig,
            { w: width, h: height }
        );
    }, [type, data, style, gridConfig, width, height]);

    // 2. Render Chart
    const renderChart = () => {
        const commonProps = {
            data,
            style,
            width,
            height,
            gridConfig // Pass gridConfig if charts accept it
        };

        switch (type) {
            case 'bar': return <BarChart {...commonProps} />;
            case 'column': return <ColumnChart {...commonProps} />;
            case 'pie': return <PieChart {...commonProps} />;
            case 'donut': return <DonutChart {...commonProps} />;
            case 'line': return <LineChart {...commonProps} />;
            case 'area': return <AreaChart {...commonProps} />;
            default: return <div className="flex items-center justify-center h-full text-gray-400">Unsupported Chart Type: {type}</div>;
        }
    };

    return (
        <div style={{ position: 'relative', width, height, border: '1px solid #eee' }}>
            {renderChart()}

            {/* 3. Render Debug Overlay */}
            {showOverlay && (
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 50
                    }}
                >
                    {/* Plot Zone */}
                    {layout.zones.plot && (
                        <rect
                            x={layout.zones.plot.x}
                            y={layout.zones.plot.y}
                            width={layout.zones.plot.width}
                            height={layout.zones.plot.height}
                            fill="none"
                            stroke="rgba(0, 0, 255, 0.5)"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                        />
                    )}

                    {/* Legend Zone */}
                    {layout.zones.legend && (
                        <rect
                            x={layout.zones.legend.x}
                            y={layout.zones.legend.y}
                            width={layout.zones.legend.width}
                            height={layout.zones.legend.height}
                            fill="rgba(0, 255, 0, 0.1)"
                            stroke="rgba(0, 255, 0, 0.5)"
                            strokeWidth="1"
                        />
                    )}

                    {/* Margins Visualization (Red Areas) */}
                    {/* Top */}
                    <rect x={0} y={0} width={width} height={layout.margins.top} fill="rgba(255, 0, 0, 0.1)" />
                    {/* Bottom */}
                    <rect x={0} y={height - layout.margins.bottom} width={width} height={layout.margins.bottom} fill="rgba(255, 0, 0, 0.1)" />
                    {/* Left */}
                    <rect x={0} y={layout.margins.top} width={layout.margins.left} height={height - layout.margins.top - layout.margins.bottom} fill="rgba(255, 0, 0, 0.1)" />
                    {/* Right */}
                    <rect x={width - layout.margins.right} y={layout.margins.top} width={layout.margins.right} height={height - layout.margins.top - layout.margins.bottom} fill="rgba(255, 0, 0, 0.1)" />

                    {/* Text Info */}
                    <text x={10} y={15} fontSize="10" fill="red" fontFamily="monospace">
                        M: {layout.margins.top} / {layout.margins.right} / {layout.margins.bottom} / {layout.margins.left}
                    </text>

                    {/* Overflow Risk Warning */}
                    {layout.overflowRisk?.hasRisk && (
                        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="24" fill="red" fontWeight="bold" opacity="0.5">
                            OVERFLOW RISK
                        </text>
                    )}
                </svg>
            )}
        </div>
    );
}
