import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { LabelManager, Label } from '../utils/labelManager';

interface BubbleChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function BubbleChart({ width, height, data, style }: BubbleChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    // For Bubble, we assume data might have a 3rd dimension or we map value to size
    // In our SimpleDataEditor, we only have 1 value per cell.
    // So distinct Bubbles usually need X, Y, R.
    // Current data structure: labels (X category usually), datasets (Y values).
    // Let's implement a simplified "Categorical Bubble":
    // X = Category Index (Label)
    // Y = Value (Position)
    // R = Value (Size) - or normalized

    const maxValue = Math.max(...values, 1);
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const primaryColor = style?.colorPalette[0] || 'rgba(0,100,200,0.5)';
    const fontFamily = style?.fontFamily || 'sans-serif';

    const maxRadius = Math.min(chartWidth / values.length, chartHeight) / 3;

    return (
        <BaseChart width={width} height={height} data={data} type="bubble">
            <g transform={`translate(${padding}, ${padding})`}>
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ddd" />

                {values.map((value, i) => {
                    const x = (i / (values.length - 1 || 1)) * chartWidth;
                    // Center vertically or map to Y? Let's map to Y to keep it chart-like
                    const y = chartHeight - ((value / maxValue) * chartHeight);
                    const r = (value / maxValue) * maxRadius + 2; // Min size 2

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r={r}
                                fill={primaryColor}
                                fillOpacity={0.6}
                                stroke={primaryColor}
                                strokeWidth={1}
                            />
                            <text
                                x={x}
                                y={y - r - 5}
                                textAnchor="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                                fill="#666"
                            >
                                {labels[i]}
                            </text>
                            <text
                                x={x}
                                y={y + 4}
                                textAnchor="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                                fill="#fff"
                                fontWeight="bold"
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
