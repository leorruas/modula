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
    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const values = dataset.data;
    const labels = data.labels || [];

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;
    const maxValue = Math.max(...values);
    const totalCount = values.reduce((a, b) => a + b, 0);

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;

    // Layout
    const padding = isInfographic ? 60 : 20;
    const chartWidth = width - (padding * 2);

    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = fontSize * 0.6; // Slightly larger estimate for safety
    // More conservative wrapping logic
    const maxCharsPerLine = Math.floor((chartWidth / Math.max(labels.length, 1)) / charWidth * 0.9) || 12;

    const wrapLabel = (text: string) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let cur = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            if ((cur + ' ' + words[i]).length <= maxCharsPerLine) {
                cur += ' ' + words[i];
            } else {
                lines.push(cur);
                cur = words[i];
            }
        }
        lines.push(cur);
        return lines.slice(0, 3);
    };
    const wrappedLabels = labels.map(wrapLabel);
    // Find the max lines needed across all labels to reserve safe bottom space
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);

    // Staggering Logic:
    // Increased threshold: if bars are < 100px wide, we stagger to be safe regardless of "wide" charts
    const barWidth = chartWidth / values.length;
    const shouldStagger = isInfographic && barWidth < 100;

    // Dynamic Stagger Offset: based on the height of the neighbor's text block
    // We add enough space so the staggered label starts CLEARLY below the longest possible neighbor label
    const staggerOffset = shouldStagger ? (maxLinesNeeded * fontSize * 1.3 + 15) : 0;

    // Total bottom padding needs to accommodate the staggered row's own height as well
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.2) + staggerOffset + 30;

    const chartHeight = height - (padding * 2) - labelBottomPadding;
    const effectiveBaselineY = chartHeight;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;

    return (
        <BaseChart width={width} height={height} data={data} type="histogram">
            <defs>
                {useGradient && (
                    <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
                    </linearGradient>
                )}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient`, primaryColor) }} />
                    </>
                )}
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={i} x1={0} y1={chartHeight * f} x2={chartWidth} y2={chartHeight * f}
                        stroke={CHART_THEME.colors.neutral.lighter} strokeWidth={1} opacity={0.15} />
                ))}

                {/* Average Marker Distribution - Infographic Only */}
                {isInfographic && (
                    <g transform={`translate(${(values.length / 2) * barWidth}, 0)`}>
                        <line y1={0} y2={chartHeight} stroke={CHART_THEME.colors.neutral.medium} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                        <text y={-15} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                            fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.05em">
                            DISTRIBUIÇÃO MÉDIA
                        </text>
                    </g>
                )}

                {values.map((value, i) => {
                    const barH = (value / Math.max(maxValue, 1)) * chartHeight;
                    const x = i * barWidth;
                    const y = chartHeight - barH;
                    const isManualHero = heroValueIndex === i;
                    const isPeak = value === maxValue && maxValue > 0;

                    const barColor = isManualHero ? primaryColor : (style?.colorPalette?.[i % (style.colorPalette?.length || 1)] || getChartColor(i));

                    // Stagger Offset calculation
                    const isStaggered = shouldStagger && (i % 2 !== 0);
                    const currentYOffset = isStaggered ? staggerOffset : 0;

                    return (
                        <g key={i}>
                            <rect
                                x={x} y={y} width={Math.max(0, barWidth - (isInfographic ? 4 : 1))} height={barH}
                                fill={
                                    style?.finish === 'glass'
                                        ? "url(#glassGradient)"
                                        : (useGradient ? "url(#histGradient)" : barColor)
                                }
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.6 : 1}
                                rx={isInfographic ? 4 : 0}
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                            />

                            {/* Infographic Value & Badges */}
                            {isInfographic && (isPeak || isManualHero || finalShowAllLabels) && (
                                <g>
                                    <text x={x + barWidth / 2} y={y - 12} textAnchor="middle"
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true) * (isManualHero ? 0.6 : 0.5)}
                                        fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black}
                                        fill={isManualHero ? primaryColor : CHART_THEME.colors.neutral.dark}>
                                        {value}
                                    </text>

                                    {isPeak && !isManualHero && (
                                        <text x={x + barWidth / 2} y={y - 32} textAnchor="middle"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                            fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill="#d97706" letterSpacing="0.1em">
                                            MODA
                                        </text>
                                    )}

                                    {isManualHero && (
                                        <text x={x + barWidth / 2} y={y - 32} textAnchor="middle"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                            fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={primaryColor} letterSpacing="0.1em">
                                            {finalAnnotationLabels?.[i]?.toUpperCase() || "HERO"}
                                        </text>
                                    )}
                                </g>
                            )}

                            {labels[i] && (
                                <g>
                                    {isStaggered && (
                                        <line x1={x + barWidth / 2} y1={effectiveBaselineY} x2={x + barWidth / 2} y2={effectiveBaselineY + currentYOffset - 5}
                                            stroke={CHART_THEME.colors.neutral.medium} strokeWidth={1} opacity={0.2} />
                                    )}
                                    <text x={x + barWidth / 2} y={effectiveBaselineY + 20 + currentYOffset} textAnchor="middle"
                                        fontSize={fontSize} fontFamily={fontFamily}
                                        fontWeight={isInfographic && (isPeak || isManualHero) ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium}
                                        fill={CHART_THEME.colors.neutral.dark}
                                        opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.6 : 1}
                                        style={{ textTransform: isInfographic ? 'uppercase' : 'none', letterSpacing: isInfographic ? '0.05em' : '0' }}>
                                        <title>{labels[i]}</title>
                                        {wrappedLabels[i].map((line, idx) => (
                                            <tspan key={idx} x={x + barWidth / 2} dy={idx === 0 ? 0 : fontSize * 1.2}>{line}</tspan>
                                        ))}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium} strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.1 : 0.3} />
            </g>
        </BaseChart>
    );
}
