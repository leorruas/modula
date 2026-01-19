import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';

interface HistogramChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function HistogramChart({ width, height, data, style }: HistogramChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;
    const maxValue = Math.max(...values);

    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / values.length;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    return (
        <BaseChart width={width} height={height} data={data} type="histogram">
            <defs>
                {useGradient && (
                    <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
                    </linearGradient>
                )}
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => (
                    <line
                        key={i}
                        x1={0}
                        y1={chartHeight * fraction}
                        x2={chartWidth}
                        y2={chartHeight * fraction}
                        stroke={CHART_THEME.colors.neutral.lighter}
                        strokeWidth={1}
                        opacity={0.15}
                    />
                ))}

                {values.map((value, i) => {
                    const barH = (value / maxValue) * chartHeight;
                    const x = i * barWidth;
                    const y = chartHeight - barH;
                    const barColor = style?.colorPalette?.[i % (style.colorPalette?.length || 1)] || getChartColor(i);

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth - (isInfographic ? 4 : 1)}
                                height={barH}
                                fill={useGradient ? "url(#histGradient)" : barColor}
                                stroke={isInfographic ? 'none' : '#fff'}
                                strokeWidth={1}
                            />
                            {isInfographic && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 12}
                                    textAnchor="middle"
                                    fontSize={CHART_THEME.fontSizes.huge}
                                    fontFamily={CHART_THEME.fonts.number}
                                    fontWeight={CHART_THEME.fontWeights.black}
                                    fill={CHART_THEME.colors.neutral.dark}
                                >
                                    {value}
                                </text>
                            )}
                            {labels[i] && (
                                <text
                                    x={x + barWidth / 2}
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

                <line
                    x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={1}
                    opacity={0.3}
                />
            </g>
        </BaseChart>
    );
}
