import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';

interface AreaChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function AreaChart({ width, height, data, style }: AreaChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const maxValue = Math.max(...values);
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Points calculation
    const points = values.map((value, i) => {
        const x = (i / (values.length - 1)) * chartWidth;
        const y = chartHeight - ((value / maxValue) * chartHeight);
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `${0},${chartHeight} ${points} ${chartWidth},${chartHeight}`;

    const primaryColor = style?.colorPalette[0] || '#333';
    const fontFamily = style?.fontFamily || 'sans-serif';

    return (
        <BaseChart width={width} height={height} data={data} type="area">
            <g transform={`translate(${padding}, ${padding})`}>
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#eee" />
                <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#eee" />

                <polygon
                    fill={primaryColor}
                    fillOpacity={0.2}
                    points={areaPoints}
                />

                <polyline
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth="2"
                    points={points}
                />

                {values.map((value, i) => {
                    const x = (i / (values.length - 1)) * chartWidth;
                    const y = chartHeight - ((value / maxValue) * chartHeight);
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r={3} fill="#fff" stroke={primaryColor} strokeWidth={2} />
                            <text
                                x={x}
                                y={chartHeight + 15}
                                textAnchor="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                            >
                                {labels[i]}
                            </text>
                        </g>
                    )
                })}
            </g>
        </BaseChart>
    );
}
