import { Chart, GridConfig } from '@/types';
import { BarChart } from '@/features/charts/components/BarChart';
import { ColumnChart } from '@/features/charts/components/ColumnChart';
import { LineChart } from '@/features/charts/components/LineChart';
import { PieChart } from '@/features/charts/components/PieChart';
import { ScatterChart } from '@/features/charts/components/ScatterChart';
import { AreaChart } from '@/features/charts/components/AreaChart';
import { DonutChart } from '@/features/charts/components/DonutChart';
import { BubbleChart } from '@/features/charts/components/BubbleChart';
import { RadarChart } from '@/features/charts/components/RadarChart';
import { HistogramChart } from '@/features/charts/components/HistogramChart';
import { MixedChart } from '@/features/charts/components/MixedChart';
import { BoxplotChart } from '@/features/charts/components/BoxplotChart';
import { PictogramChart } from '@/features/charts/components/PictogramChart';
import { TreemapChart } from '@/features/charts/components/TreemapChart';

import { useEffect } from 'react';

interface OffScreenChartRendererProps {
    chart: Chart | null;
    width: number;
    height: number;
    gridConfig: GridConfig;
    id: string; // for document.getElementById
    onReady?: () => void;
}

export function OffScreenChartRenderer({ chart, width, height, gridConfig, id, onReady }: OffScreenChartRendererProps) {

    // Trigger onReady when chart is mounted
    useEffect(() => {
        if (chart && onReady) {
            // Small buffer to allow internal chart animations/rendering to settle
            // This is safer than a blind timeout in the parent loop because it's tied to this component's lifecycle.
            const timer = setTimeout(() => {
                onReady();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [chart, onReady]);

    if (!chart) return null;

    // We render the chart with the exact dimensions provided (from its module configuration)
    // The parent controls the container "id" which we use to grab the SVG.

    return (
        <div
            id={id}
            style={{
                width,
                height,
                position: 'relative',
                background: 'white' // Ensure background is white for PNG capture
            }}
        >
            <div style={{ width: '100%', height: '100%' }}>
                {chart.type === 'bar' && <BarChart width={width} height={height} data={chart.data} style={chart.style} gridConfig={gridConfig} baseFontSize={gridConfig.baseFontSize} baseFontUnit={gridConfig.baseFontUnit} />}
                {chart.type === 'column' && <ColumnChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'line' && <LineChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'pie' && <PieChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'donut' && <DonutChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'scatter' && <ScatterChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'bubble' && <BubbleChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'radar' && <RadarChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'histogram' && <HistogramChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'mixed' && <MixedChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'boxplot' && <BoxplotChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'pictogram' && <PictogramChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'area' && <AreaChart width={width} height={height} data={chart.data} style={chart.style} />}
                {chart.type === 'treemap' && <TreemapChart width={width} height={height} data={chart.data} style={chart.style} />}
            </div>
        </div>
    );
}
