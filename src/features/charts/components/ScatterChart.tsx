import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { LabelManager, Label } from '../utils/labelManager';

interface ScatterChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function ScatterChart({ width, height, data, style }: ScatterChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const maxValue = Math.max(...values);
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const primaryColor = style?.colorPalette[0] || 'rgba(0,0,0,0.5)';
    const fontFamily = style?.fontFamily || 'sans-serif';

    // Pre-calculate positions to run collision detection
    const rawLabels: Label[] = values.map((value, i) => {
        const x = (i / (values.length - 1 || 1)) * chartWidth;
        const y = chartHeight - ((value / maxValue) * chartHeight);

        const text = labels[i];
        const textWidth = text.length * 6;
        const textHeight = 12;

        return {
            id: i.toString(),
            x: x - textWidth / 2, // Centered
            y: y - 8 - textHeight, // Above dot
            width: textWidth,
            height: textHeight,
            text: text,
            priority: value
        };
    });

    const visibleLabels = LabelManager.resolveCollisions(rawLabels, chartWidth, chartHeight);

    return (
        <BaseChart width={width} height={height} data={data} type="scatter">
            <g transform={`translate(${padding}, ${padding})`}>
                <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#ddd" />
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ddd" />

                {values.map((value, i) => {
                    const x = (i / (values.length - 1 || 1)) * chartWidth;
                    const y = chartHeight - ((value / maxValue) * chartHeight);
                    const labelState = visibleLabels.find(l => l.id === i.toString());

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r={4}
                                fill={primaryColor}
                            />
                            {labelState?.visible && (
                                <text
                                    x={x}
                                    y={y - 8}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontFamily={fontFamily}
                                    fill="#666"
                                >
                                    {labelState.text}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
