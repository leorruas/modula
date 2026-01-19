import { ChartData, ChartStyle } from '@/types';
import { GaugeChart } from './GaugeChart';

interface GenericChartProps {
    data: ChartData;
    width: number;
    height: number;
    style?: ChartStyle;
    type: string;
}

export function GenericChart({ data, width, height, style, type }: GenericChartProps) {
    if (type === 'gauge') {
        return <GaugeChart width={width} height={height} data={data} style={style} />;
    }

    // Basic SVG placeholder
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <rect width={width} height={height} fill="#f0f0f0" rx={4} />
            <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" fill="#999" fontSize={12} fontFamily="sans-serif">
                {type.toUpperCase()} Chart
            </text>
            <text x={width / 2} y={height / 2 + 15} textAnchor="middle" dominantBaseline="middle" fill="#ccc" fontSize={10} fontFamily="sans-serif">
                (Em breve)
            </text>
        </svg>
    );
}
