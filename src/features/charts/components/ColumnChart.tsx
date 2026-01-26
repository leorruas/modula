import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createGlassGradient, createMiniIOSGlassFilter } from '@/utils/chartTheme';
import { ensureDistinctColors } from '@/utils/colors';
import { smartFormatChartValue } from '@/utils/formatters';

interface ColumnChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function ColumnChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: ColumnChartProps) {
    if (!data.datasets || data.datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';

    // Infographic Config (Phase 2 & 3)
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalShowDeltaPercent = infographicConfig.showDeltaPercent || false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;

    // Calculate global max value across all datasets
    const allValues = data.datasets.flatMap(d => d.data || []);
    const maxValue = Math.max(...allValues, 1); // Avoid 0
    const minValue = Math.min(...allValues, Infinity);
    const avgValue = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;

    // Base Metrics
    const categoryCount = labels.length;
    const barsPerGroup = data.datasets.length;

    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.small;

    // --- PHASE 1 & 2: Natural Height & Scaling logic ---
    const baseFontSizeValue = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? (barsPerGroup > 2 ? 'medium' : 'large') : 'small', isInfographic);
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');

    // Natural Clearance
    const naturalBadgeOffset = isInfographic ? 45 : 30;
    const naturalTextHeight = isInfographic ? baseFontSizeValue * 2.6 : baseFontSizeValue * 1.2;
    const naturalTopMargin = Math.max(naturalBadgeOffset + (isInfographic ? 15 : 5), naturalTextHeight + 5);

    const naturalGraphHeight = 250; // Increased from 150 to give bars more prominence

    // Bottom Metrics for Staggering
    const groupWidthGuess = (width - padding * 2) / Math.max(categoryCount, 1);
    const charWidth = fontSize * 0.5;
    const maxCharsPerLine = Math.floor((groupWidthGuess * 0.7) / charWidth);

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
        return lines.slice(0, 3);
    };
    const wrappedLabels = labels.map(wrapLabel);
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);
    const isDenseLayout = groupWidthGuess < 100;
    const staggerBuffer = isDenseLayout ? (maxLinesNeeded * fontSize * 1.4) + 15 : 0;
    const naturalBottomPadding = (maxLinesNeeded * fontSize * 1.3) + 20 + staggerBuffer;

    const totalNaturalHeight = naturalTopMargin + naturalGraphHeight + naturalBottomPadding;
    const isVerticalLegend = finalLegendPosition === 'top' || finalLegendPosition === 'bottom';
    const legendAllowance = isVerticalLegend ? 40 : 0;
    const availableHeight = height - (padding * 2) - legendAllowance;

    // The SCALE FACTOR: If we are taller than what's available, we shrink everything
    // In Infographic mode, we aim for maximum "fill", so we always scale to available space
    const scaleFactor = isInfographic
        ? (availableHeight / totalNaturalHeight)
        : (totalNaturalHeight > availableHeight ? availableHeight / totalNaturalHeight : 1);

    // Final Scaled Dimensions
    const topMargin = naturalTopMargin * scaleFactor;
    const chartWidth = width - (padding * 2);
    const chartHeight = availableHeight; // We use the full available height now, scaling content inside
    const effectiveChartHeight = (naturalGraphHeight) * scaleFactor;
    const labelBottomPadding = naturalBottomPadding * scaleFactor;

    // Grouping Logic (Final)
    const groupWidth = chartWidth / Math.max(categoryCount, 1);
    const groupGap = groupWidth * 0.3;
    const colWidth = (groupWidth - groupGap) / barsPerGroup;
    const colInnerGap = colWidth * 0.1;

    // Color logic
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const isSingleSeries = data.datasets.length === 1;
    const computedColors = ensureDistinctColors(baseColors, isSingleSeries ? categoryCount : barsPerGroup);

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label || 'sans-serif';
    const dataFont = isInfographic ? (CHART_THEME.fonts.data || CHART_THEME.fonts.number || 'sans-serif') : (CHART_THEME.fonts.number || 'sans-serif');
    const narrativeFont = CHART_THEME.fonts.label || 'sans-serif';
    const useGradient = style?.useGradient;

    // Legend Component
    const Legend = finalLegendPosition !== 'none' && barsPerGroup > 0 ? (
        <div style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '10px',
            background: isInfographic ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderRadius: 8
        }}>
            {data.datasets.map((ds, i) => (ds.label && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {style?.finish === 'glass' ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ overflow: 'visible' }}>
                            <g dangerouslySetInnerHTML={{ __html: createMiniIOSGlassFilter(`miniGlassCol-${i}`) }} />
                            <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`miniGradCol-${i}`, computedColors[i % computedColors.length]) }} />
                            <rect
                                x="1" y="1" width="12" height="12" rx="3"
                                fill={`url(#miniGradCol-${i})`}
                                filter={`url(#miniGlassCol-${i})`}
                                stroke="white" strokeWidth="0.5" strokeOpacity="0.5"
                            />
                        </svg>
                    ) : (
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: computedColors[i % computedColors.length] }} />
                    )}
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily }}>{ds.label}</span>
                </div>
            )))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="column" legend={Legend} legendPosition={finalLegendPosition}>
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
                {/* Glass Definitions */}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        {computedColors.map((color, i) => (
                            <g key={`glass-grad-${i}`} dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-${i}`, color) }} />
                        ))}
                    </>
                )}
            </defs>

            <g transform={`translate(${padding}, ${padding + topMargin})`}>
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const y = effectiveChartHeight * fraction;
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

                {labels.map((label, i) => {
                    const groupX = i * groupWidth;

                    return (
                        <g key={i} transform={`translate(${groupX}, 0)`}>
                            {/* Wrapped Horizontal Labels with Staggering */}
                            {(() => {
                                // STAGGERING LOGIC
                                // 1. Detect density
                                const isDense = groupWidth < 100;
                                // 2. Calculate offset
                                const isStaggered = isDense && i % 2 !== 0; // Stagger odd items
                                const staggerOffset = isStaggered ? (maxLinesNeeded * fontSize * 1.4 * scaleFactor) + (15 * scaleFactor) : 0;
                                const labelY = effectiveChartHeight + (20 * scaleFactor) + staggerOffset;

                                // 3. Leader Lines (The "Why")
                                // Connect staggered labels back to their column so the eye can follow (Common Fate)
                                const showLeaderLine = isStaggered && isInfographic;

                                return (
                                    <>
                                        {/* Leader Line for Staggered Items */}
                                        {showLeaderLine && (
                                            <line
                                                x1={(groupWidth - groupGap) / 2}
                                                y1={effectiveChartHeight + (5 * scaleFactor)}
                                                x2={(groupWidth - groupGap) / 2}
                                                y2={effectiveChartHeight + (15 * scaleFactor) + staggerOffset - (fontSize * scaleFactor)}
                                                stroke={CHART_THEME.colors.neutral.medium}
                                                strokeWidth={1}
                                                strokeDasharray="2 2"
                                                opacity={0.3}
                                            />
                                        )}

                                        <text
                                            x={(groupWidth - groupGap) / 2}
                                            y={labelY}
                                            textAnchor="middle"
                                            fontSize={fontSize * (isInfographic ? 0.9 : 1) * scaleFactor}
                                            fontFamily={narrativeFont}
                                            fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                            fill={CHART_THEME.colors.neutral.dark}
                                            opacity={isInfographic ? 0.8 : 1}
                                            letterSpacing={isInfographic ? "0.03em" : "normal"}
                                        >
                                            <title>{label}</title>
                                            {wrappedLabels[i].map((line, lineIdx) => (
                                                <tspan
                                                    key={lineIdx}
                                                    x={(groupWidth - groupGap) / 2}
                                                    dy={lineIdx === 0 ? 0 : fontSize * 1.2 * scaleFactor}
                                                >
                                                    {isInfographic ? line.toUpperCase() : line}
                                                </tspan>
                                            ))}
                                        </text>
                                    </>
                                );
                            })()}

                            {/* Grouped Columns */}
                            {data.datasets.map((dataset, dsIndex) => {
                                const value = dataset.data[i] || 0;
                                const barH = (value / maxValue) * (effectiveChartHeight);
                                const x = dsIndex * colWidth;
                                const y = effectiveChartHeight - barH;
                                const color = computedColors[dsIndex % computedColors.length];

                                // Proportional Scaling (Phase 1)
                                const ratio = value / maxValue;
                                const getTypographyForValue = (ratio: number) => {
                                    if (!isInfographic) return { fontWeight: CHART_THEME.fontWeights.semibold, opacity: 1, sizeMultiplier: 1, textTransform: 'none' as const, letterSpacing: 'normal' };
                                    if (ratio >= 0.8) return { fontWeight: CHART_THEME.fontWeights.black, opacity: 1, sizeMultiplier: 2.0, textTransform: 'uppercase' as const, letterSpacing: '-0.04em' };
                                    if (ratio >= 0.5) return { fontWeight: CHART_THEME.fontWeights.semibold, opacity: 1, sizeMultiplier: 1.5, textTransform: 'none' as const, letterSpacing: '-0.01em' };
                                    return { fontWeight: CHART_THEME.fontWeights.normal, opacity: 0.9, sizeMultiplier: 1.0, textTransform: 'none' as const, letterSpacing: 'normal' };
                                };
                                const typo = getTypographyForValue(ratio);

                                // Hero Override (Phase 2)
                                const isManualHero = heroValueIndex !== undefined && heroValueIndex === i;
                                const finalSizeMultiplier = isManualHero ? typo.sizeMultiplier * 1.3 : typo.sizeMultiplier;
                                const heroOpacityBoost = isManualHero ? 1 : typo.opacity;

                                // baseFontSizeValue is already calculated at the top

                                return (
                                    <g key={dsIndex}>
                                        {/* Ghost Column */}
                                        <rect
                                            x={x} y={0} width={colWidth - colInnerGap} height={effectiveChartHeight}
                                            fill="#f3f4f6" opacity={0.6} rx={(colWidth - colInnerGap) / 2}
                                        />

                                        {/* Data Column */}
                                        <rect
                                            x={x} y={y} width={colWidth - colInnerGap} height={barH}
                                            fill={style?.finish === 'glass' ? `url(#glassGradient-${isSingleSeries ? i % computedColors.length : dsIndex % computedColors.length})` : (useGradient ? `url(#colGradient-${isSingleSeries ? i % computedColors.length : dsIndex % computedColors.length})` : (isSingleSeries ? computedColors[i % computedColors.length] : computedColors[dsIndex % computedColors.length]))}
                                            opacity={1}
                                            rx={(colWidth - colInnerGap) / 2}
                                            filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : "url(#colShadow)"}
                                        />

                                        {/* Annotation Badge (Phase 2 & 3) */}
                                        {(() => {
                                            let badgeText = "";
                                            let badgeColor = CHART_THEME.colors.neutral.medium;
                                            let showBadge = false;

                                            if (finalShowValueAnnotations && isManualHero) {
                                                badgeText = finalAnnotationLabels?.[i] || "DESTAQUE";
                                                showBadge = true;
                                            } else if (finalUseMetadata && dataset.metadata?.[i]) {
                                                badgeText = dataset.metadata[i];
                                                badgeColor = CHART_THEME.colors.primary[0] || '#3b82f6';
                                                showBadge = true;
                                            } else if (finalShowExtremes && !isManualHero) {
                                                if (value === maxValue && value > avgValue) {
                                                    badgeText = "🏆 MÁXIMO";
                                                    badgeColor = '#d97706';
                                                    showBadge = true;
                                                } else if (value === minValue && value < avgValue) {
                                                    badgeText = "🔻 MÍNIMO";
                                                    badgeColor = '#ef4444';
                                                    showBadge = true;
                                                }
                                            }

                                            if (!showBadge) return null;

                                            return (
                                                <text
                                                    x={x + (colWidth - colInnerGap) / 2}
                                                    y={y - (isInfographic ? 45 * scaleFactor : 30 * scaleFactor)}
                                                    textAnchor="middle"
                                                    fontSize={baseFontSizeValue * 0.6 * scaleFactor}
                                                    fontFamily={dataFont}
                                                    fontWeight={CHART_THEME.fontWeights.black}
                                                    letterSpacing="0.1em"
                                                    fill={badgeColor}
                                                    opacity={0.7}
                                                >
                                                    {badgeText.toUpperCase()}
                                                </text>
                                            );
                                        })()}

                                        {/* Value Label */}
                                        <text
                                            x={x + (colWidth - colInnerGap) / 2}
                                            y={y - (isInfographic ? 12 * scaleFactor : 8 * scaleFactor)}
                                            textAnchor="middle"
                                            fontSize={baseFontSizeValue * finalSizeMultiplier * scaleFactor}
                                            fontFamily={dataFont}
                                            fontWeight={typo.fontWeight}
                                            letterSpacing={typo.letterSpacing}
                                            fill={CHART_THEME.colors.neutral.dark}
                                            opacity={heroOpacityBoost}
                                            style={{ textTransform: typo.textTransform }}
                                        >
                                            {smartFormatChartValue(value, style?.numberFormat)}
                                            {isInfographic && finalShowDeltaPercent && (
                                                <tspan
                                                    dx={8 * scaleFactor}
                                                    fontSize="0.5em"
                                                    fontWeight={CHART_THEME.fontWeights.bold}
                                                    fill={value >= avgValue ? '#10b981' : '#ef4444'}
                                                    opacity={0.8}
                                                >
                                                    {value >= avgValue ? '↑' : '↓'}
                                                    {Math.abs(((value - avgValue) / (avgValue || 1)) * 100).toFixed(0)}%
                                                </tspan>
                                            )}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* X-axis line */}
                <line
                    x1={0}
                    y1={effectiveChartHeight}
                    x2={chartWidth}
                    y2={effectiveChartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
            </g>
        </BaseChart>
    );
}
