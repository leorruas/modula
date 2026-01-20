import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';

interface HistogramChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function HistogramChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: HistogramChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;
    const maxValue = Math.max(...values);

    const padding = isInfographic ? CHART_THEME.padding.large : 0;
    const chartWidth = width - (isInfographic ? padding * 2 : CHART_THEME.padding.small * 2);

    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = fontSize * 0.5;
    const maxLines = 3;
    const maxCharsPerLine = Math.floor((chartWidth / Math.max(labels.length, 1)) / charWidth);

    const wrapLabel = (text: string) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            if ((currentLine + ' ' + words[i]).length <= maxCharsPerLine) {
                currentLine += ' ' + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines.slice(0, maxLines);
    };

    const wrappedLabels = labels.map(wrapLabel);
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.2) + 20;

    const chartHeight = height - (isInfographic ? padding * 2 : CHART_THEME.padding.small * 2) - labelBottomPadding;
    const effectiveBaselineY = chartHeight;
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
                {/* Glass Definitions */}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        {(style?.colorPalette || [primaryColor]).map((color, i) => (
                            <g key={`glass-grad-${i}`} dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-${i}`, color) }} />
                        ))}
                        {!style?.colorPalette && (
                            <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-default`, primaryColor) }} />
                        )}
                    </>
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
                                fill={
                                    style?.finish === 'glass'
                                        ? (style?.colorPalette ? `url(#glassGradient-${i % style.colorPalette.length})` : `url(#glassGradient-default)`)
                                        : (useGradient ? "url(#histGradient)" : barColor)
                                }
                                stroke={style?.finish === 'glass' ? "none" : (isInfographic ? 'none' : '#fff')}
                                strokeWidth={1}
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                            />
                            {isInfographic && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 12}
                                    textAnchor="middle"
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true)}
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
                                    y={effectiveBaselineY + 20}
                                    textAnchor="middle"
                                    fontSize={fontSize}
                                    fontFamily={fontFamily}
                                    fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                    fill={CHART_THEME.colors.neutral.dark}
                                >
                                    <title>{labels[i]}</title>
                                    {wrappedLabels[i].map((line, lineIdx) => (
                                        <tspan
                                            key={lineIdx}
                                            x={x + barWidth / 2}
                                            dy={lineIdx === 0 ? 0 : fontSize * 1.2}
                                        >
                                            {line}
                                        </tspan>
                                    ))}
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
