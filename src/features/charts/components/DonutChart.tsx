import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont } from '@/utils/chartTheme';
import { generateMonochromaticPalette, ensureDistinctColors } from '@/utils/colors';

interface DonutChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function DonutChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: DonutChartProps) {
    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const values = dataset.data;
    const labels = data.labels || [];

    const isInfographic = style?.mode === 'infographic';
    const total = values.reduce((a, b) => a + b, 0);
    const padding = isInfographic ? 80 : 20;
    const outerRadius = (Math.min(width, height) / 2) - padding;
    const innerRadius = outerRadius * 0.6;
    const centerX = width / 2;
    const centerY = height / 2;

    const useGradient = style?.useGradient;
    const initialColors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];

    let colors = initialColors;
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
            <defs>
                {useGradient && colors.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`donutGradient-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </radialGradient>
                ))}
            </defs>
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

                    const currentStartAngle = startAngle;
                    startAngle += sliceAngle;

                    return (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={useGradient ? `url(#donutGradient-${i % colors.length})` : colors[i % colors.length]}
                                filter="url(#chartShadow)"
                                stroke="#fff"
                                strokeWidth={isInfographic ? 3 : 1.5}
                                strokeLinejoin="round"
                            />

                            {isInfographic ? (
                                <>
                                    <text
                                        x={lx}
                                        y={ly - getScaledFont(baseFontSize, baseFontUnit, 'huge') / 2 - 5} // Adjust y based on font size
                                        textAnchor="middle"
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true)}
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
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
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
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
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
