import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';
import { generateMonochromaticPalette, ensureDistinctColors } from '@/utils/colors';

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

    const isInfographic = style?.mode === 'infographic';
    const total = values.reduce((a, b) => a + b, 0);
    const padding = isInfographic ? 40 : 20;
    const outerRadius = (Math.min(width, height) / 2) - padding - (isInfographic ? 30 : 0);
    const innerRadius = outerRadius * 0.6;
    const centerX = width / 2;
    const centerY = height / 2;

    let colors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];
    if (values.length > colors.length) {
        if (colors.length === 1) {
            colors = generateMonochromaticPalette(colors[0], values.length);
        } else {
            colors = ensureDistinctColors(colors, values.length);
        }
    }
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    let startAngle = 0;

    return (
        <BaseChart width={width} height={height} data={data} type="donut">
            <g transform={`translate(${centerX}, ${centerY})`}>
                {values.map((value, i) => {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;

                    const x1 = outerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = outerRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = outerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = outerRadius * Math.sin(endAngle - Math.PI / 2);

                    const x3 = innerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y3 = innerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x4 = innerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y4 = innerRadius * Math.sin(startAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        `Z`
                    ].join(' ');

                    const percentage = ((value / total) * 100).toFixed(1);
                    const labelAngle = startAngle + sliceAngle / 2;
                    const labelR = isInfographic ? outerRadius + 40 : (outerRadius + innerRadius) / 2;
                    const lx = labelR * Math.cos(labelAngle - Math.PI / 2);
                    const ly = labelR * Math.sin(labelAngle - Math.PI / 2);

                    startAngle += sliceAngle;

                    return (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={colors[i % colors.length]}
                                stroke={isInfographic ? 'none' : '#fff'}
                                strokeWidth={isInfographic ? 0 : 2}
                            />

                            {isInfographic ? (
                                <>
                                    <line
                                        x1={outerRadius * 0.9 * Math.cos(labelAngle - Math.PI / 2)}
                                        y1={outerRadius * 0.9 * Math.sin(labelAngle - Math.PI / 2)}
                                        x2={lx}
                                        y2={ly}
                                        stroke={CHART_THEME.colors.neutral.medium}
                                        strokeWidth={1}
                                        opacity={0.3}
                                    />
                                    <text
                                        x={lx}
                                        y={ly - 15}
                                        textAnchor="middle"
                                        fontSize={CHART_THEME.fontSizes.huge}
                                        fontFamily={CHART_THEME.fonts.number}
                                        fontWeight={CHART_THEME.fontWeights.black}
                                        fill={CHART_THEME.colors.neutral.dark}
                                    >
                                        {percentage}%
                                    </text>
                                    <text
                                        x={lx}
                                        y={ly + 5}
                                        textAnchor="middle"
                                        fontSize={CHART_THEME.fontSizes.small}
                                        fontFamily={fontFamily}
                                        fontWeight={CHART_THEME.fontWeights.medium}
                                        fill={CHART_THEME.colors.neutral.medium}
                                    >
                                        {labels[i]}
                                    </text>
                                </>
                            ) : (
                                <text
                                    x={lx}
                                    y={ly}
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    fontSize={CHART_THEME.fontSizes.small}
                                    fontFamily={fontFamily}
                                    fill="#fff"
                                    fontWeight={CHART_THEME.fontWeights.semibold}
                                >
                                    {`${labels[i]} ${percentage}%`}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
