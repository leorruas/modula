import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { generateMonochromaticPalette } from '@/utils/colors';

interface DonutChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function DonutChart({ width, height, data, style }: DonutChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const total = values.reduce((a, b) => a + b, 0);
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.6;
    const centerX = width / 2;
    const centerY = height / 2;

    let colors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];
    if (values.length > colors.length) {
        if (colors.length === 1) {
            colors = generateMonochromaticPalette(colors[0], values.length);
        }
    }
    const fontFamily = style?.fontFamily || 'sans-serif';

    let startAngle = 0;

    return (
        <BaseChart width={width} height={height} data={data} type="donut">
            <g transform={`translate(${centerX}, ${centerY})`}>
                {values.map((value, i) => {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;

                    const x1 = radius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = radius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = radius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = radius * Math.sin(endAngle - Math.PI / 2);

                    const x3 = innerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y3 = innerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x4 = innerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y4 = innerRadius * Math.sin(startAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        `Z`
                    ].join(' ');

                    const labelAngle = startAngle + sliceAngle / 2;
                    const labelR = radius * 0.8; // Middle of ring
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
                                strokeWidth="2"
                            />
                            {sliceAngle > 0.3 && (
                                <text
                                    x={lx}
                                    y={ly}
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    fontSize="9"
                                    fontFamily={fontFamily}
                                    fill="#fff"
                                    fontWeight="bold"
                                >
                                    {labels[i]}
                                </text>
                            )}
                        </g>
                    );
                })}
                <text x={0} y={0} textAnchor="middle" alignmentBaseline="middle" fontSize={14} fontWeight="bold" fill="#333">
                    {total}
                </text>
            </g>
        </BaseChart>
    );
}
