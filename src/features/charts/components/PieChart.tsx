import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { generateMonochromaticPalette, ensureDistinctColors } from '@/utils/colors';
import { CHART_THEME } from '@/utils/chartTheme';

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

    const isInfographic = style?.mode === 'infographic';
    const total = values.reduce((a, b) => a + b, 0);
    // Infographic needs space for external labels (approx 50px). Classic uses internal labels (10px padding).
    const padding = isInfographic ? 80 : CHART_THEME.padding.small;
    const radius = (Math.min(width, height) / 2) - padding;
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
    const useGradient = style?.useGradient;

    let startAngle = 0;

    return (
        <BaseChart width={width} height={height} data={data} type="pie">
            <defs>
                {useGradient && colors.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`pieGradient-${i}`} cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="70%" stopColor={color} stopOpacity="0.85" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </radialGradient>
                ))}
            </defs>
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

                    // Percentage
                    const percentage = ((value / total) * 100).toFixed(1);

                    // Label position
                    const labelAngle = startAngle + sliceAngle / 2;
                    const labelR = isInfographic ? radius + 40 : radius * 0.7;
                    const lx = labelR * Math.cos(labelAngle - Math.PI / 2);
                    const ly = labelR * Math.sin(labelAngle - Math.PI / 2);

                    startAngle += sliceAngle;

                    return (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={useGradient ? `url(#pieGradient-${i % colors.length})` : colors[i % colors.length]}
                                filter={useGradient ? "url(#chartShadow)" : "none"}
                                stroke={isInfographic ? 'none' : '#fff'}
                                strokeWidth={isInfographic ? 0 : 2}
                            />

                            {isInfographic ? (
                                // Infographic mode: external labels with percentages
                                <>
                                    {/* Percentage - HERO */}
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
                                    {/* Label */}
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
                                // Classic mode: internal labels
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
                                    {`${labels[i]}\n${percentage}%`}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
