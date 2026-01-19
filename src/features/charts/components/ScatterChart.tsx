import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont } from '@/utils/chartTheme';

interface ScatterChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function ScatterChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: ScatterChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;
    const maxValue = Math.max(...values);
    const padding = isInfographic ? CHART_THEME.padding.large : 0;
    const chartWidth = width - (isInfographic ? padding * 2 : CHART_THEME.padding.small * 2);
    const chartHeight = height - (isInfographic ? padding * 2 : CHART_THEME.padding.small * 2);

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    return (
        <BaseChart width={width} height={height} data={data} type="scatter">
            <defs>
                {useGradient && (
                    <radialGradient id="scatterGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
                    </radialGradient>
                )}
            </defs>
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
                                opacity={0.1}
                                strokeDasharray="4 4"
                            />
                        ))}
                        {[0.25, 0.5, 0.75, 1].map((fraction, i) => (
                            <line
                                key={`v${i}`}
                                x1={chartWidth * fraction}
                                y1={0}
                                x2={chartWidth * fraction}
                                y2={chartHeight}
                                stroke={CHART_THEME.colors.neutral.lighter}
                                strokeWidth={1}
                                opacity={0.1}
                                strokeDasharray="4 4"
                            />
                        ))}
                    </>
                )}

                {/* Data points */}
                {values.map((value, i) => {
                    const x = (i / (values.length - 1)) * chartWidth;
                    const y = chartHeight - ((value / maxValue) * chartHeight);

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r={isInfographic ? 8 : 5}
                                fill={useGradient ? "url(#scatterGradient)" : primaryColor}
                                opacity={0.9}
                                stroke="#fff"
                                strokeWidth={2}
                                filter="url(#chartShadow)"
                            />
                            {isInfographic && (
                                <text
                                    x={x}
                                    y={y - 15}
                                    textAnchor="middle"
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true)}
                                    fontFamily={CHART_THEME.fonts.number}
                                    fontWeight={CHART_THEME.fontWeights.black}
                                    fill={CHART_THEME.colors.neutral.dark}
                                >
                                    {value}
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
