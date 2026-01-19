import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';

import { ensureDistinctColors } from '@/utils/colors';

interface BarChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function BarChart({ width, height, data, style }: BarChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';


    const maxValue = Math.max(...values);


    // Smart Margins
    const basePadding = isInfographic ? 40 : CHART_THEME.padding.small;
    const marginTop = basePadding;
    const marginRight = isInfographic ? 80 : basePadding; // More space for huge numeric values
    const marginBottom = basePadding + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 20);
    const marginLeft = isInfographic ? 140 : basePadding + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 40); // More space for labels

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;
    const barHeight = chartHeight / values.length;
    const barGap = barHeight * 0.3;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;

    // Color logic: ensure distinct colors if multiple bars
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, values.length);



    return (
        <BaseChart width={width} height={height} data={data} type="bar">
            <defs>
                <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation={CHART_THEME.effects.shadowBlur} />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope={CHART_THEME.effects.shadowOpacity} />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                {useGradient && computedColors.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`barGradient-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </linearGradient>
                ))}
            </defs>

            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {/* Grid lines - only in classic mode */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const x = chartWidth * fraction;
                    return (
                        <line
                            key={i}
                            x1={x}
                            y1={0}
                            x2={x}
                            y2={chartHeight}
                            stroke={CHART_THEME.colors.neutral.lighter}
                            strokeWidth={1}
                            opacity={0.15}
                        />
                    );
                })}

                {/* Bars and labels */}
                {values.map((value, i) => {
                    const barW = (value / maxValue) * chartWidth;
                    const y = i * barHeight;
                    return (
                        <g key={i}>
                            {/* Icon + Label */}
                            <g>

                                <text
                                    x={-10}
                                    y={y + (barHeight - barGap) / 2}
                                    dy=".35em"
                                    textAnchor="end"
                                    fontSize={isInfographic ? CHART_THEME.fontSizes.medium : CHART_THEME.fontSizes.small}
                                    fontFamily={fontFamily}
                                    fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                    fill={CHART_THEME.colors.neutral.dark}
                                >
                                    {labels[i]}
                                </text>
                            </g>

                            {/* Bar with color */}
                            <rect
                                x={0}
                                y={y}
                                width={barW}
                                height={barHeight - barGap}
                                fill={useGradient ? `url(#barGradient-${i % computedColors.length})` : computedColors[i % computedColors.length]}
                                opacity={0.8}
                                rx={CHART_THEME.effects.borderRadius}
                                filter="url(#barShadow)"
                            />

                            {/* Value - GIANT in infographic mode */}
                            <text
                                x={barW + 8}
                                y={y + (barHeight - barGap) / 2}
                                dy=".35em"
                                fontSize={isInfographic ? CHART_THEME.fontSizes.huge : CHART_THEME.fontSizes.medium}
                                fontFamily={CHART_THEME.fonts.number}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}

                {/* Y-axis line */}
                <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />

                {/* Axis labels */}
                {data.xAxisLabel && (
                    <text
                        x={chartWidth / 2}
                        y={chartHeight + 25}
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.xAxisLabel}
                    </text>
                )}
                {data.yAxisLabel && (
                    <text
                        transform="rotate(-90)"
                        x={-chartHeight / 2}
                        y={-marginLeft + 15} // Position relative to new left margin
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.yAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
