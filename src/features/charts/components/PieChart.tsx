import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { generateMonochromaticPalette } from '@/utils/colors';

interface PieChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function PieChart({ width, height, data, style }: PieChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const total = values.reduce((a, b) => a + b, 0);
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;

    let colors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];
    // If we have more values than colors, and especially if we only have 1 color, generate shades
    if (values.length > colors.length) {
        if (colors.length === 1) {
            colors = generateMonochromaticPalette(colors[0], values.length);
        } else {
            // Repeat or interpolate? For now, repeat logic handles it below (i % colors.length)
            // But for cleaner look, maybe generate more? Let's stick to simple generation if strictly 1 color provided.
        }
    }
    const fontFamily = style?.fontFamily || 'sans-serif';

    let startAngle = 0;

    return (
        <BaseChart width={width} height={height} data={data} type="pie">
            <g transform={`translate(${centerX}, ${centerY})`}>
                {values.map((value, i) => {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;

                    const x1 = radius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = radius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = radius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = radius * Math.sin(endAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M 0 0`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `Z`
                    ].join(' ');

                    const labelAngle = startAngle + sliceAngle / 2;
                    const labelR = radius * 0.7;
                    const lx = labelR * Math.cos(labelAngle - Math.PI / 2);
                    const ly = labelR * Math.sin(labelAngle - Math.PI / 2);

                    const currentStartAngle = startAngle;
                    startAngle += sliceAngle;

                    return (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={colors[i % colors.length]}
                                stroke="#fff"
                                strokeWidth="1"
                            />
                            <text
                                x={lx}
                                y={ly}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                                fill="#fff"
                            >
                                {labels[i]}
                            </text>
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
