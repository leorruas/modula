import { Chart, GridConfig } from '@/types';
import { useSmartLayout } from '@/hooks/useSmartLayout';
import { BarChart } from '@/features/charts/components/BarChart';
import { ColumnChart } from '@/features/charts/components/ColumnChart';
import { LineChart } from '@/features/charts/components/LineChart';
import { AreaChart } from '@/features/charts/components/AreaChart';
import { PieChart } from '@/features/charts/components/PieChart';
import { DonutChart } from '@/features/charts/components/DonutChart';
import { ScatterChart } from '@/features/charts/components/ScatterChart';
import { RadarChart } from '@/features/charts/components/RadarChart';
import { GaugeChart } from '@/features/charts/components/GaugeChart';
import { MixedChart } from '@/features/charts/components/MixedChart';
import { PictogramChart } from '@/features/charts/components/PictogramChart';

interface ChartItemProps {
    chart: Chart;
    gridConfig: GridConfig;
    module: { w: number; h: number };
}

export function ChartItem({ chart, gridConfig, module }: ChartItemProps) {
    // Compute smart layout
    const computedLayout = useSmartLayout(
        {
            type: chart.type,
            data: chart.data,
            style: chart.style
        },
        gridConfig,
        module
    );

    // Route to appropriate chart component
    const commonProps = {
        width: module.w,
        height: module.h,
        data: chart.data,
        style: chart.style,
        baseFontSize: gridConfig.baseFontSize,
        baseFontUnit: gridConfig.baseFontUnit,
        gridConfig, // Pass gridConfig to chart components
        computedLayout // Pass the computed layout
    };

    switch (chart.type) {
        case 'bar':
            return <BarChart {...commonProps} />;
        case 'column':
            return <ColumnChart {...commonProps} />;
        case 'line':
            return <LineChart {...commonProps} />;
        case 'area':
            return <AreaChart {...commonProps} />;
        case 'pie':
            return <PieChart {...commonProps} />;
        case 'donut':
            return <DonutChart {...commonProps} />;
        case 'scatter':
            return <ScatterChart {...commonProps} />;
        case 'radar':
            return <RadarChart {...commonProps} />;
        case 'gauge':
            return <GaugeChart {...commonProps} />;
        case 'mixed':
            return <MixedChart {...commonProps} />;
        case 'pictogram':
            return <PictogramChart {...commonProps} />;
        default:
            return <div>Unsupported chart type: {chart.type}</div>;
    }
}
