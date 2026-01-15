import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';

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

    const isInfographic = style?.mode === 'infographic';
    const maxValue = Math.max(...values);
    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    return (
        <BaseChart width={width} height={height} data={data} type="bubble">
            <g transform={`translate(${padding}, ${padding})`}>
                {/* Grid - only classic */}
                {!isInfographic && (
                    <>
                        {[0.25, 0.5, 0.75, 1].map((fraction, i) => (
                            <line
                                key={`h${i}`}
                                x1={0}
                                y1={chartHeight * fraction}
                                x2={chartWidth}
                                y2={chartHeight * fraction}
                                stroke={CHART_THEME.colors.neutral.lighter}
                                strokeWidth={1}
                                opacity={0.15}
                            />
                        ))}
                    </>
                )}

                {/* Bubbles */}
                {values.map((value, i) => {
                    const x = (i / (values.length - 1)) * chartWidth;
                    const y = chartHeight - ((value / maxValue) * chartHeight);
                    const radius = isInfographic ? (value / maxValue) * 40 + 10 : (value / maxValue) * 30 + 5;

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r={radius}
                                fill={primaryColor}
                                opacity={0.5}
                                stroke={primaryColor}
                                strokeWidth={2}
                            />
                            <text
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize={isInfographic ? CHART_THEME.fontSizes.huge : CHART_THEME.fontSizes.medium}
                                fontFamily={CHART_THEME.fonts.number}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {value}
                            </text>
                            {labels[i] && (
                                <text
                                    x={x}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    fontSize={isInfographic ? CHART_THEME.fontSizes.medium : CHART_THEME.fontSizes.small}
                                    fontFamily={fontFamily}
                                    fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                    fill={CHART_THEME.colors.neutral.dark}
                                >
                                    {labels[i]}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Axes */}
                <line
                    x1={0}
                    y1={chartHeight}
                    x2={chartWidth}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
                <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
            </g>
        </BaseChart>
    );
}
