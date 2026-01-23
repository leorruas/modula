import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassLineFilter, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { ensureDistinctColors } from '@/utils/colors';

interface LineChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function LineChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: LineChartProps) {
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
    const maxValue = Math.max(...allValues, 1);
    const minValue = Math.min(...allValues, Infinity);
    const avgValue = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;

    // --- NATURAL HEIGHT & SCALING (Applied from ColumnChart Fix) ---
    // Natural Clearance
    const baseFontSizeValue = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small', isInfographic);
    const naturalBadgeOffset = isInfographic ? 45 : 30;
    const naturalTextHeight = isInfographic ? baseFontSizeValue * 2.6 : baseFontSizeValue * 1.2;
    const naturalTopMargin = Math.max(naturalBadgeOffset + (isInfographic ? 25 : 10), naturalTextHeight + 15);

    const naturalGraphHeight = 250; // Use prominent height similar to ColumnChart

    // Bottom Metrics for Staggering
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = fontSize * 0.5;
    const padding = isInfographic ? 40 : 0;

    // Robust defaults for Natural Calculation / Label Wrapping:
    const tempSidePadding = isInfographic ? 60 : 25;
    const groupWidthGuess = (width - tempSidePadding * 2) / Math.max(labels.length, 1);
    const maxCharsPerLine = Math.floor((groupWidthGuess * 0.7) / charWidth);

    // Label Wrapping Logic (moved up)
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
    const naturalBottomPadding = (maxLinesNeeded * fontSize * 1.3) + 30;

    const totalNaturalHeight = naturalTopMargin + naturalGraphHeight + naturalBottomPadding;

    const isVerticalLegend = finalLegendPosition === 'top' || finalLegendPosition === 'bottom';
    const legendAllowance = isVerticalLegend ? 40 : 0;
    const availableHeight = height - (padding * 2) - legendAllowance;

    // SCALE FACTOR
    const scaleFactor = isInfographic
        ? (availableHeight / totalNaturalHeight)
        : (totalNaturalHeight > availableHeight ? availableHeight / totalNaturalHeight : 1);

    // Final Scaled Dimensions
    const marginTop = naturalTopMargin * scaleFactor;
    const marginBottom = naturalBottomPadding * scaleFactor;

    // Margins - INCREASED to 80px for Safety in Export
    const marginRight = isInfographic ? 80 : (isInfographic ? padding : CHART_THEME.padding.small);
    const marginLeft = isInfographic ? 60 : (isInfographic ? padding : CHART_THEME.padding.small) + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 25);

    // FINAL CHART WIDTH (Safe)
    const chartWidth = width - marginLeft - marginRight;

    // FINAL HEIGHTS (Correct Order)
    const effectiveChartHeight = naturalGraphHeight * scaleFactor;
    const chartHeight = effectiveChartHeight;

    const effectiveBaselineY = effectiveChartHeight;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label || 'sans-serif';
    const dataFont = isInfographic ? (CHART_THEME.fonts.data || CHART_THEME.fonts.number || 'sans-serif') : (CHART_THEME.fonts.number || 'sans-serif');

    // Color logic
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, data.datasets.length);

    // Legend Component
    const Legend = finalLegendPosition !== 'none' && data.datasets.length > 0 ? (
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
                    <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: computedColors[i % computedColors.length],
                        ...(style?.finish === 'glass' && {
                            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(0,0,0,0.1))',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        })
                    }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily }}>{ds.label}</span>
                </div>
            )))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="line" legend={Legend} legendPosition={finalLegendPosition}>
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {/* Grid lines */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const y = chartHeight * fraction;
                    return (
                        <line
                            key={`grid-${i}`}
                            x1={0} y1={y} x2={chartWidth} y2={y}
                            stroke={CHART_THEME.colors.neutral.lighter}
                            strokeWidth={CHART_THEME.strokeWidths.grid || 1}
                            opacity={0.1} strokeDasharray="4 4"
                        />
                    );
                })}

                <defs>
                    {style?.finish === 'glass' && (
                        <>
                            <g dangerouslySetInnerHTML={{ __html: createIOSGlassLineFilter('glassLineFilter') }} />
                            <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('glassPointFilter') }} />
                        </>
                    )}
                </defs>

                {/* X-axis */}
                <line
                    x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />

                {/* Render Datasets */}
                {data.datasets.map((dataset, dsIndex) => {
                    const color = computedColors[dsIndex % computedColors.length];
                    const values = dataset.data;

                    const points = values.map((value, i) => {
                        const x = (i / (values.length - 1)) * chartWidth;
                        const y = chartHeight - ((value / maxValue) * chartHeight);
                        return `${x},${y}`;
                    }).join(' ');

                    return (
                        <g key={`dataset-${dsIndex}`}>
                            <polyline
                                fill="none" stroke={color}
                                strokeWidth={isInfographic ? 4 : CHART_THEME.strokeWidths.line}
                                strokeLinecap="round" strokeLinejoin="round" points={points}
                                filter={style?.finish === 'glass' ? "url(#glassLineFilter)" : "url(#chartShadow)"}
                                opacity={style?.finish === 'glass' ? 0.9 : 1}
                            />

                            {values.map((value, i) => {
                                const x = (i / (values.length - 1)) * chartWidth;
                                const y = chartHeight - ((value / maxValue) * chartHeight);

                                // Proportional Scaling (Phase 1)
                                const ratio = value / maxValue;
                                const getTypographyForValue = (ratio: number) => {
                                    if (!isInfographic) return { fontWeight: CHART_THEME.fontWeights.semibold, opacity: 1, sizeMultiplier: 1, letterSpacing: 'normal' };
                                    if (ratio >= 0.8) return { fontWeight: CHART_THEME.fontWeights.black, opacity: 1, sizeMultiplier: 2.0, letterSpacing: '-0.04em' };
                                    if (ratio >= 0.5) return { fontWeight: CHART_THEME.fontWeights.semibold, opacity: 1, sizeMultiplier: 1.5, letterSpacing: '-0.01em' };
                                    return { fontWeight: CHART_THEME.fontWeights.normal, opacity: 0.9, sizeMultiplier: 1.0, letterSpacing: 'normal' };
                                };
                                const typo = getTypographyForValue(ratio);

                                // Hero Override (Phase 2)
                                const isManualHero = heroValueIndex !== undefined && heroValueIndex === i;
                                const finalSizeMultiplier = isManualHero ? typo.sizeMultiplier * 1.3 : typo.sizeMultiplier;
                                const heroOpacityBoost = isManualHero ? 1 : typo.opacity;

                                const baseFontSizeValue = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small', isInfographic);

                                return (
                                    <g key={`point-${i}`}>
                                        <circle
                                            cx={x} cy={y}
                                            r={isInfographic ? (6 * (isManualHero ? 1.5 : (ratio >= 0.8 ? 1.2 : 1.0))) : 4}
                                            fill={style?.finish === 'glass' ? color : (isManualHero ? color : "#fff")}
                                            stroke={style?.finish === 'glass' ? "none" : color}
                                            strokeWidth={isInfographic ? 3 : 2.5}
                                            filter={style?.finish === 'glass' ? "url(#glassPointFilter)" : undefined}
                                            opacity={1}
                                        />

                                        {/* X-axis Label */}
                                        {dsIndex === 0 && (
                                            <text
                                                x={x} y={effectiveBaselineY + 20 * scaleFactor} textAnchor="middle"
                                                fontSize={fontSize} fontFamily={fontFamily}
                                                fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                                fill={CHART_THEME.colors.neutral.dark}
                                                opacity={1}
                                            >
                                                <title>{labels[i]}</title>
                                                {wrappedLabels[i].map((line, lineIdx) => (
                                                    <tspan key={lineIdx} x={x} dy={lineIdx === 0 ? 0 : fontSize * 1.2}>
                                                        {isInfographic ? line.toUpperCase() : line}
                                                    </tspan>
                                                ))}
                                            </text>
                                        )}

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
                                                    x={x} y={y - (isInfographic ? 50 : 35)}
                                                    textAnchor="middle" fontSize={baseFontSizeValue * 0.6}
                                                    fontFamily={dataFont} fontWeight={CHART_THEME.fontWeights.black}
                                                    letterSpacing="0.1em" fill={badgeColor} opacity={0.7}
                                                >
                                                    {badgeText.toUpperCase()}
                                                </text>
                                            );
                                        })()}

                                        {/* Value Label */}
                                        <text
                                            x={x} y={y - (isInfographic ? 20 : 12)} textAnchor="middle"
                                            fontSize={baseFontSizeValue * finalSizeMultiplier}
                                            fontFamily={dataFont} fontWeight={typo.fontWeight}
                                            letterSpacing={typo.letterSpacing} fill={color}
                                            opacity={heroOpacityBoost}
                                            style={{ textTransform: ratio >= 0.8 && isInfographic ? 'uppercase' : 'none' }}
                                        >
                                            {value}
                                            {isInfographic && finalShowDeltaPercent && (
                                                <tspan
                                                    dx={8} fontSize="0.5em" fontWeight={CHART_THEME.fontWeights.bold}
                                                    fill={value >= avgValue ? '#10b981' : '#ef4444'} opacity={0.8}
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

                {/* Axis Titles */}
                {data.xAxisLabel && (
                    <text
                        x={chartWidth / 2} y={chartHeight + 45} textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium} fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold} fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.xAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
