import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';
import { ensureDistinctColors } from '@/utils/colors';

interface ColumnChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function ColumnChart({ width, height, data, style }: ColumnChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';
    const maxValue = Math.max(...values);
    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const colWidth = chartWidth / values.length;
    const colGap = colWidth * 0.3;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;

    // Color logic
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, values.length);

    return (
        <BaseChart width={width} height={height} data={data} type="column">
            <defs>
                <filter id="colShadow" x="-50%" y="-50%" width="200%" height="200%">
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
                    <linearGradient key={`grad-${i}`} id={`colGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </linearGradient>
                ))}
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
                {/* Grid lines - only in classic mode */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const y = chartHeight * fraction;
                    return (
                        <line
                            key={i}
                            x1={0}
                            y1={y}
                            x2={chartWidth}
                            y2={y}
                            stroke={CHART_THEME.colors.neutral.lighter}
                            strokeWidth={1}
                            opacity={0.15}
                        />
                    );
                })}

                {values.map((value, i) => {
                    const barH = (value / maxValue) * chartHeight;
                    const x = i * colWidth;
                    const y = chartHeight - barH;

                    return (
                        <g key={i}>
                            {/* Label */}
                            <text
                                x={x + (colWidth - colGap) / 2}
                                y={chartHeight + 20}
                                textAnchor="middle"
                                fontSize={isInfographic ? CHART_THEME.fontSizes.medium : CHART_THEME.fontSizes.small}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {labels[i]}
                            </text>

                            {/* Column with gradient and shadow */}
                            <rect
                                x={x}
                                y={y}
                                width={colWidth - colGap}
                                height={barH}
                                fill={useGradient ? `url(#colGradient-${i % computedColors.length})` : computedColors[i % computedColors.length]}
                                opacity={0.8}
                                rx={CHART_THEME.effects.borderRadius}
                                filter="url(#colShadow)"
                            />

                            {/* Value - GIANT in infographic mode */}
                            <text
                                x={x + (colWidth - colGap) / 2}
                                y={y - (isInfographic ? 15 : 8)}
                                textAnchor="middle"
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

                {/* X-axis line */}
                <line
                    x1={0}
                    y1={chartHeight}
                    x2={chartWidth}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
                {/* Y-Axis Label */}
                {data.yAxisLabel && (
                    <text
                        transform="rotate(-90)"
                        x={-chartHeight / 2}
                        y={-CHART_THEME.spacing.axisTitleCompact}
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
