import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';

interface ColumnChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function ColumnChart({ width, height, data, style }: ColumnChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const maxValue = Math.max(...values);
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const colWidth = chartWidth / values.length;
    const colGap = colWidth * 0.2;

    const primaryColor = style?.colorPalette[0] || '#333';
    const fontFamily = style?.fontFamily || 'sans-serif';

    return (
        <BaseChart width={width} height={height} data={data} type="column">
            <g transform={`translate(${padding}, ${padding})`}>
                {values.map((value, i) => {
                    const barH = (value / maxValue) * chartHeight;
                    const x = i * colWidth;
                    const y = chartHeight - barH;

                    return (
                        <g key={i}>
                            <text
                                x={x + (colWidth - colGap) / 2}
                                y={chartHeight + 15}
                                textAnchor="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                            >
                                {labels[i]}
                            </text>
                            <rect
                                x={x}
                                y={y}
                                width={colWidth - colGap}
                                height={barH}
                                fill={primaryColor}
                            />
                            <text
                                x={x + (colWidth - colGap) / 2}
                                y={y - 5}
                                textAnchor="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                                fill="#666"
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#000" />
            </g>
        </BaseChart>
    );
}
