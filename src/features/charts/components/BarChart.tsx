import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';
import { getIcon } from '@/utils/iconLibrary';

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
    const hasIcons = data.iconConfig?.enabled && data.iconConfig?.category && data.iconConfig?.iconKey;

    const maxValue = Math.max(...values);
    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barHeight = chartHeight / values.length;
    const barGap = barHeight * 0.3;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    // Get icon component if enabled
    const IconComponent = hasIcons ? getIcon(
        data.iconConfig!.category as any,
        data.iconConfig!.iconKey
    ) : null;

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
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
                </linearGradient>
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
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
                                {hasIcons && IconComponent && (
                                    <foreignObject
                                        x={-35}
                                        y={y + (barHeight - barGap) / 2 - 10}
                                        width={20}
                                        height={20}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                            <IconComponent size={16} color={CHART_THEME.colors.neutral.dark} strokeWidth={2} />
                                        </div>
                                    </foreignObject>
                                )}
                                <text
                                    x={hasIcons ? -10 : -10}
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

                            {/* Bar with gradient and shadow */}
                            <rect
                                x={0}
                                y={y}
                                width={barW}
                                height={barHeight - barGap}
                                fill="url(#barGradient)"
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
                        x={-chartHeight / 2}
                        y={-28}
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                        transform={`rotate(-90, ${-chartHeight / 2}, -28)`}
                    >
                        {data.yAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
