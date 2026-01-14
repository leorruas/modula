import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, createShadowFilter, createGradient } from '@/utils/chartTheme';

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

    const maxValue = Math.max(...values);
    const padding = CHART_THEME.padding.large;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barHeight = chartHeight / values.length;
    const barGap = barHeight * 0.3;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    return (
        <BaseChart width={width} height={height} data={data} type="bar">
            {createShadowFilter('barShadow')}
            {createGradient('barGradient', primaryColor, 'horizontal')}

            <g transform={`translate(${padding}, ${padding})`}>
                {/* Subtle grid lines */}
                {[0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const x = chartWidth * fraction;
                    return (
                        <line
                            key={i}
                            x1={x}
                            y1={0}
                            x2={x}
                            y2={chartHeight}
                            stroke={CHART_THEME.colors.neutral.lighter}
                            strokeWidth={CHART_THEME.strokeWidths.grid}
                            opacity={CHART_THEME.effects.gridOpacity}
                        />
                    );
                })}

                {/* Bars and labels */}
                {values.map((value, i) => {
                    const barW = (value / maxValue) * chartWidth;
                    const y = i * barHeight;
                    return (
                        <g key={i}>
                            {/* Label */}
                            <text
                                x={-10}
                                y={y + (barHeight - barGap) / 2}
                                dy=".35em"
                                textAnchor="end"
                                fontSize={CHART_THEME.fontSizes.medium}
                                fontFamily={fontFamily}
                                fontWeight={CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {labels[i]}
                            </text>

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

                            {/* Value */}
                            <text
                                x={barW + 8}
                                y={y + (barHeight - barGap) / 2}
                                dy=".35em"
                                fontSize={CHART_THEME.fontSizes.medium}
                                fontFamily={CHART_THEME.fonts.value}
                                fontWeight={CHART_THEME.fontWeights.semibold}
                                fill={CHART_THEME.colors.neutral.medium}
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
                    opacity={CHART_THEME.effects.axisOpacity}
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
