import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';

interface HistogramChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function HistogramChart({ width, height, data, style }: HistogramChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const maxValue = Math.max(...values, 1);
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Histogram distinctive feature: no gap between bars
    const barWidth = chartWidth / values.length;

    const primaryColor = style?.colorPalette[0] || '#333';
    const fontFamily = style?.fontFamily || 'sans-serif';

    return (
        <BaseChart width={width} height={height} data={data} type="histogram">
            <g transform={`translate(${padding}, ${padding})`}>
                {/* Axis Lines */}
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#333" strokeWidth={1} />

                {/* Grid lines (horizontal) */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line
                        key={t}
                        x1={0}
                        y1={chartHeight * (1 - t)}
                        x2={chartWidth}
                        y2={chartHeight * (1 - t)}
                        stroke="#eee"
                        strokeDasharray="4 4"
                    />
                ))}

                {values.map((value, i) => {
                    const barHeight = (value / maxValue) * chartHeight;
                    const x = i * barWidth;
                    const y = chartHeight - barHeight;

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth} // No gap
                                height={barHeight}
                                fill={primaryColor}
                                stroke="white" // Separator
                                strokeWidth={1}
                            />
                            {/* Label Logic: Show every Nth label if too crowded */}
                            {values.length < 12 || i % 2 === 0 ? (
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight + 15}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontFamily={fontFamily}
                                    fill="#666"
                                >
                                    {labels[i]}
                                </text>
                            ) : null}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
