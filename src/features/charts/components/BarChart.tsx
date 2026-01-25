import { ChartData, ChartStyle, GridConfig } from '@/types';
import { BaseChart } from './BaseChart';
import { ComputedLayout } from '@/services/smartLayout/types';
import { SmartLayoutEngine } from '@/services/smartLayout/SmartLayoutEngine';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createGlassGradient, createGlassBorderGradient, createMiniIOSGlassFilter } from '@/utils/chartTheme';

import { ColorService } from '@/services/color/ColorService';


interface BarChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
    gridConfig: GridConfig; // Required for Smart Layout Engine

    // Phase 2: Optional Controls
    heroValueIndex?: number;           // Manual hero value highlighting (index)
    showValueAnnotations?: boolean;    // Show annotation badges
    showDeltaPercent?: boolean;        // Show % vs average
    annotationLabels?: string[];       // Custom labels for annotations (by index)
    legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';

    // Smart Layout Integration (optional override)
    computedLayout?: ComputedLayout;
    target?: 'screen' | 'pdf'; // Export target
}

export function BarChart({
    width,
    height,
    data,
    style,
    baseFontSize = 11,
    baseFontUnit = 'pt',
    gridConfig,
    heroValueIndex,
    showValueAnnotations = false,
    showDeltaPercent = false,
    annotationLabels,
    legendPosition,
    computedLayout,
    target = 'screen'
}: BarChartProps) {
    if (!data.datasets || data.datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';

    // Extract infographic config from style (allows control via style or direct props)
    const infographicConfig = style?.infographicConfig;
    const finalHeroValueIndex = heroValueIndex ?? infographicConfig?.heroValueIndex;
    const finalShowValueAnnotations = showValueAnnotations || infographicConfig?.showValueAnnotations || false;
    const finalShowDeltaPercent = showDeltaPercent || infographicConfig?.showDeltaPercent || false;
    const finalAnnotationLabels = annotationLabels ?? infographicConfig?.annotationLabels;
    const finalLegendPosition = legendPosition || style?.legendPosition || infographicConfig?.legendPosition || 'bottom';
    const finalShowExtremes = infographicConfig?.showExtremes || false;
    const finalUseMetadata = infographicConfig?.useMetadata || false;

    // Calculate global max value across all datasets
    const allValues = data.datasets.flatMap(d => d.data || []);
    const maxValue = Math.max(...allValues, 1); // Avoid 0
    const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
    const avgValue = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0;

    // FASE 2: Smart Layout Engine Integration
    const layout = computedLayout || SmartLayoutEngine.computeLayout(
        {
            type: 'bar',
            data: { labels, datasets: data.datasets },
            style: {
                fontFamily: style?.fontFamily || CHART_THEME.fonts.label || 'sans-serif',
                legendPosition: finalLegendPosition,
                mode: isInfographic ? 'infographic' : 'classic',
                colorPalette: style?.colorPalette // Critical fix: pass colors to Engine

            }
        },
        gridConfig,
        { w: width, h: height },
        target
    );

    // Extract Engine calculations
    const { margins, typeSpecific } = layout;
    const { labelWrapThreshold, barThickness: engineBarThickness, isStacked } = typeSpecific || {};

    // FASE 4.3: Smart Sorting order
    const renderOrder = typeSpecific?.sortedIndices || labels.map((_, i) => i);


    // Use Engine's margins (100% Engine, zero fallback)
    const marginTop = margins.top;
    const marginRight = margins.right;
    const marginBottom = margins.bottom;
    const marginLeft = margins.left;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    // Font and layout calculations
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const isStackedLayout = isStacked ?? false;

    const padding = isInfographic ? CHART_THEME.padding.large : 0;

    // Use Engine's smart wrapped labels (FASE 1.3 + Smart Label Wrapping)
    // Includes: orphan prevention, max 12 words/line, adaptive strategies
    const wrappedLabels = typeSpecific?.wrappedLabels || labels.map(label => [label]);
    const maxLinesUsed = isStackedLayout ? Math.max(...wrappedLabels.map(l => l.length), 1) : 1;

    // Intelligent Weighted Grouping Logic
    const categoryCount = labels.length;
    const barsPerGroup = data.datasets.length;
    const interGroupGap = isStackedLayout ? 16 : 8; // Fixed gap between categories
    const labelBarGap = isStackedLayout ? 6 : 0;   // Gap between label and its bars
    const baseBarHeight = 22; // Increased from 14 for more prominence
    const barInnerGap = baseBarHeight * 0.1;

    // 1. Calculate the 'natural' height for each category
    const categoryNaturalHeights = wrappedLabels.map((wl) => {
        const lines = wl.length;
        const lH = isStackedLayout ? (lines * fontSize * 1.2) + labelBarGap : 0;
        const bH = barsPerGroup * baseBarHeight + (barsPerGroup - 1) * barInnerGap;
        return lH + bH;
    });

    const totalNaturalHeight = categoryNaturalHeights.reduce((a, b) => a + b, 0) + (categoryCount - 1) * interGroupGap;

    // 2. Calculate scaling or centering
    // If it exceeds chartHeight, scale everything. If not, just center vertically.
    // In Infographic mode, we ALWAYS scale to fill the height (Responsiveness rule)
    const scaleFactor = isInfographic
        ? (chartHeight / totalNaturalHeight)
        : (totalNaturalHeight > chartHeight ? chartHeight / totalNaturalHeight : 1);

    const verticalOffset = (!isInfographic && totalNaturalHeight < chartHeight) ? (chartHeight - totalNaturalHeight) / 2 : 0;

    // 3. Final positions and scaled dimensions
    const groupLayout: { y: number; height: number }[] = [];
    let currentY = verticalOffset;

    for (let i = 0; i < categoryCount; i++) {
        const h = categoryNaturalHeights[i] * scaleFactor;
        groupLayout.push({ y: currentY, height: h });
        currentY += h + (interGroupGap * scaleFactor);
    }

    const barHeight = baseBarHeight * scaleFactor;
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label || 'sans-serif';

    // Typography Skill: Dual-font system for Infographic
    const narrativeFont = isInfographic ? (CHART_THEME.fonts.narrative || fontFamily) : fontFamily;
    const dataFont = isInfographic ? (CHART_THEME.fonts.data || CHART_THEME.fonts.number || 'sans-serif') : (CHART_THEME.fonts.number || 'sans-serif');

    const useGradient = style?.useGradient;

    // Color logic
    // FASE 4.2: Use Engine-provided colors if available
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const isSingleSeries = data.datasets.length === 1;

    // Use datasetColors from Engine if available, otherwise fallback to local calculation (shouldn't happen if Engine is updated)
    const computedColors = typeSpecific?.datasetColors || ColorService.ensureDistinctColors(baseColors, isSingleSeries ? categoryCount : barsPerGroup);


    // Legend Component
    const isSideLegend = finalLegendPosition === 'left' || finalLegendPosition === 'right';
    const Legend = (data.datasets.length > 1 && finalLegendPosition !== 'none') ? (
        <div style={{
            display: 'flex',
            gap: isSideLegend ? 12 : 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            flexDirection: isSideLegend ? 'column' : 'row',
            alignItems: isSideLegend ? 'flex-start' : 'center'
        }}>
            {data.datasets.map((ds, i) => (ds.label && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {style?.finish === 'glass' ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ overflow: 'visible' }}>
                            <g dangerouslySetInnerHTML={{ __html: createMiniIOSGlassFilter(`miniGlass-${i}`) }} />
                            <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`miniGrad-${i}`, computedColors[i % computedColors.length]) }} />
                            <rect
                                x="1" y="1" width="12" height="12" rx="3"
                                fill={`url(#miniGrad-${i})`}
                                filter={`url(#miniGlass-${i})`}
                                stroke="white" strokeWidth="0.5" strokeOpacity="0.5"
                            />
                        </svg>
                    ) : (
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: computedColors[i % computedColors.length] }} />
                    )}
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily: narrativeFont }}>{ds.label}</span>
                </div>
            )))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="bar" legend={Legend} legendPosition={finalLegendPosition}>
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
                {useGradient && computedColors.map((color, idx) => (
                    <linearGradient key={`grad-${idx}`} id={`barGradient-${idx}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </linearGradient>
                ))}

                {/* Transparency / Glass Filter */}
                {/* Transparency / Glass Filter */}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createGlassBorderGradient('glassBorder') }} />
                        {computedColors.map((color, i) => (
                            <g key={`glass-grad-${i}`} dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-${i}`, color) }} />
                        ))}
                    </>
                )}
            </defs>

            <g transform={`translate(${marginLeft}, ${marginTop})`}>
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

                {/* Categories */}
                {renderOrder.map((dataIndex: number, i: number) => {

                    const { y, height: groupHeight } = groupLayout[i]; // Access layout for visual position 'i'
                    const labelLines = wrappedLabels[i].length; // Layout logic corresponds to visual position 'i' because wrappers were calculated for the layout? 
                    // WAIT. Engine calculates wrapping for specific labels.
                    // If we sort, the labels move.
                    // Does Engine return wrappedLabels in sorted order?
                    // Engine computes 'wrappedLabels' in 'computeDynamicMargins'.
                    // If we passed unsorted labels to Engine, it returns wrappedLabels matching input order.
                    // If we sort VISUALLY here, we must access wrappedLabels[dataIndex].

                    const lines = wrappedLabels[dataIndex] || [labels[dataIndex]];
                    const label = labels[dataIndex];

                    const catLabelHeight = isStackedLayout ? ((lines.length * fontSize * 1.2) + 6) * scaleFactor : 0;

                    return (
                        <g key={dataIndex} transform={`translate(0, ${y})`}>
                            {/* Category Label */}
                            <text
                                x={isStackedLayout ? 0 : -16}
                                y={isStackedLayout ? fontSize * 0.8 * scaleFactor : (groupHeight - (barsPerGroup * barHeight)) / 2}
                                dy={isStackedLayout ? ".35em" : ".35em"}
                                textAnchor={isStackedLayout ? "start" : "end"}
                                fontSize={fontSize * (isInfographic ? 0.85 : 1)}
                                fontFamily={narrativeFont}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.bold : (isStackedLayout ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium)}
                                letterSpacing={isInfographic ? "0.08em" : "normal"}
                                fill={CHART_THEME.colors.neutral.dark}
                                opacity={isInfographic ? 0.6 : 1}
                            >
                                <title>{label}</title>
                                {/* Use wrapped lines for specific label */}
                                {lines.map((line, lineIdx) => (
                                    <tspan
                                        key={lineIdx}
                                        x={0}
                                        dy={lineIdx === 0 ? 0 : fontSize * 1.2}
                                    >
                                        {isInfographic ? line.toUpperCase() : line}
                                    </tspan>
                                ))}
                            </text>


                            {/* Grouped Bars */}
                            {data.datasets.map((dataset, dsIndex) => {
                                const value = dataset.data[dataIndex] || 0; // Use sorted dataIndex
                                const barW = (value / maxValue) * chartWidth;
                                const barY = (isStackedLayout ? catLabelHeight : (groupHeight - (barsPerGroup * barHeight)) / 2) + dsIndex * barHeight;
                                // Identity preservation: Color depends on dataIndex (category) for single series
                                const color = isSingleSeries
                                    ? computedColors[dataIndex % computedColors.length]
                                    : computedColors[dsIndex % computedColors.length];

                                const radius = barHeight / 2;

                                // --- Shared Calculations (Hoist to top of loop) ---
                                const ratio = value / maxValue;
                                const baseFontSizeValue = getScaledFont(
                                    baseFontSize,
                                    baseFontUnit,
                                    isInfographic ? (barsPerGroup > 2 ? 'medium' : 'large') : 'small',
                                    isInfographic
                                );

                                // Typography hierarchy logic
                                const getTypographyForValue = (ratio: number) => {
                                    if (!isInfographic) {
                                        return {
                                            fontWeight: CHART_THEME.fontWeights.semibold,
                                            letterSpacing: 'normal',
                                            textTransform: 'none' as const,
                                            opacity: 1,
                                            sizeMultiplier: 1
                                        };
                                    }
                                    if (ratio >= 0.8) {
                                        return {
                                            fontWeight: CHART_THEME.fontWeights.black,
                                            letterSpacing: '-0.04em',
                                            textTransform: 'uppercase' as const,
                                            opacity: 1,
                                            sizeMultiplier: 2.0
                                        };
                                    } else if (ratio >= 0.5) {
                                        return {
                                            fontWeight: CHART_THEME.fontWeights.semibold,
                                            letterSpacing: '-0.01em',
                                            textTransform: 'none' as const,
                                            opacity: 0.85,
                                            sizeMultiplier: 1.5
                                        };
                                    } else {
                                        return {
                                            fontWeight: CHART_THEME.fontWeights.normal,
                                            letterSpacing: 'normal',
                                            textTransform: 'none' as const,
                                            opacity: 0.6,
                                            sizeMultiplier: 1.0
                                        };
                                    }
                                };

                                const typo = getTypographyForValue(ratio);

                                // Hero / Highlight Logic
                                const isManualHero = heroValueIndex !== undefined
                                    && heroValueIndex >= 0
                                    && heroValueIndex < labels.length
                                    && heroValueIndex === dataIndex; // Use dataIndex for identity check

                                const finalSizeMultiplier = isManualHero
                                    ? typo.sizeMultiplier * 1.3
                                    : typo.sizeMultiplier;

                                const heroOpacityBoost = isManualHero ? 1 : typo.opacity;

                                return (
                                    <g key={dsIndex}>
                                        {/* Ghost Bar / Background Track */}
                                        <rect
                                            x={0}
                                            y={barY}
                                            width={chartWidth}
                                            height={barHeight - barInnerGap}
                                            fill="#f3f4f6"
                                            opacity={0.6}
                                            rx={radius}
                                        />

                                        {/* Data Bar */}
                                        <rect
                                            x={0}
                                            y={barY}
                                            width={barW}
                                            height={barHeight - barInnerGap}
                                            fill={
                                                style?.finish === 'glass'
                                                    ? `url(#glassGradient-${isSingleSeries ? dataIndex % computedColors.length : dsIndex % computedColors.length})`
                                                    : useGradient
                                                        ? `url(#barGradient-${isSingleSeries ? dataIndex % computedColors.length : dsIndex % computedColors.length})`
                                                        : color
                                            }
                                            opacity={style?.finish === 'glass' ? 1 : 0.9}
                                            rx={radius}
                                            filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : "url(#barShadow)"}
                                        />

                                        {/* Annotation Badge (Phase 2 & 3) */}
                                        {(() => {
                                            let badgeText = "";
                                            let badgeColor = CHART_THEME.colors.neutral.medium;
                                            let showBadge = false;

                                            // 1. Manual Annotation (Highest Priority)
                                            if (finalShowValueAnnotations && isManualHero) {
                                                badgeText = finalAnnotationLabels?.[i] || "DESTAQUE";
                                                showBadge = true;
                                            }
                                            // 2. Metadata Annotation (Phase 3)
                                            else if (finalUseMetadata && dataset.metadata?.[i]) {
                                                badgeText = dataset.metadata[i];
                                                badgeColor = CHART_THEME.colors.primary[0] || '#3b82f6';
                                                showBadge = true;
                                            }
                                            // 3. Automatic Extremes (Phase 3)
                                            else if (finalShowExtremes && !isManualHero) {
                                                if (value === maxValue && value > avgValue) {
                                                    badgeText = "🏆 MÁXIMO";
                                                    badgeColor = '#d97706'; // Amber/Gold
                                                    showBadge = true;
                                                } else if (value === minValue && value < avgValue) {
                                                    badgeText = "🔻 MÍNIMO";
                                                    badgeColor = '#ef4444'; // Red
                                                    showBadge = true;
                                                }
                                            }

                                            if (!showBadge) return null;

                                            return (
                                                <text
                                                    x={barW + 8}
                                                    y={barY - 8}
                                                    fontSize={baseFontSizeValue * 0.65}
                                                    fontFamily={dataFont}
                                                    fontWeight={CHART_THEME.fontWeights.bold}
                                                    letterSpacing="0.1em"
                                                    textAnchor="start"
                                                    fill={badgeColor}
                                                    opacity={0.6}
                                                >
                                                    {badgeText.toUpperCase()}
                                                </text>
                                            );
                                        })()}

                                        {/* Value Text */}
                                        {(() => {
                                            // FASE 4.1: Smart Positioning Logic
                                            // Default to outside if not specified
                                            let labelX = barW + 8;
                                            let labelAnchor: "start" | "end" | "middle" = "start";
                                            let labelColor = CHART_THEME.colors.neutral.dark; // Default dark for outside

                                            // Smart Positioning
                                            const globalPositioning = typeSpecific?.valuePositioning || 'auto';

                                            // Logic: 'auto' means try inside, fallback to outside. 
                                            // 'inside' means force inside (or try inside is safer).
                                            // 'outside' means force outside.

                                            const valueStr = typo.textTransform === 'uppercase' ? String(value).toUpperCase() : String(value);
                                            const estimatedLabelWidth = valueStr.length * (baseFontSizeValue * finalSizeMultiplier) * 0.6;

                                            // Vertical fit check: Ensure bar height is sufficient for the font size
                                            const estimatedLabelHeight = baseFontSizeValue * finalSizeMultiplier * 0.8;
                                            const actualBarHeight = barHeight - barInnerGap;

                                            if (globalPositioning === 'auto' || globalPositioning === 'inside') {
                                                const horizontalFit = barW > estimatedLabelWidth + 24;
                                                const verticalFit = actualBarHeight > estimatedLabelHeight;

                                                if (horizontalFit && verticalFit) {
                                                    labelX = barW - 12; // Padding from end
                                                    labelAnchor = "end";
                                                    labelColor = ColorService.getBestContrastColor(color);
                                                } else {
                                                    // Fallback to outside if it doesn't fit
                                                    labelX = barW + 8;
                                                    labelAnchor = "start";
                                                    labelColor = CHART_THEME.colors.neutral.dark;
                                                }
                                            }



                                            return (
                                                <text
                                                    x={labelX}
                                                    y={barY + (barHeight - barInnerGap) / 2}
                                                    dy=".35em"
                                                    fontSize={baseFontSizeValue * finalSizeMultiplier}
                                                    fontFamily={dataFont}
                                                    fontWeight={typo.fontWeight}
                                                    letterSpacing={typo.letterSpacing}
                                                    fill={labelColor}
                                                    textAnchor={labelAnchor}
                                                    opacity={heroOpacityBoost}
                                                >
                                                    {valueStr}
                                                </text>
                                            );
                                        })()}

                                        {/* Delta Percent (Phase 2) */}
                                        {finalShowDeltaPercent && (() => {
                                            const delta = ((value - avgValue) / avgValue) * 100;
                                            const sign = delta > 0 ? '+' : '';
                                            const deltaText = delta === 0 ? '±0%' : `${sign}${delta.toFixed(0)}%`;

                                            // Calculate approximate width of main value
                                            const valueStr = typo.textTransform === 'uppercase' ? String(value).toUpperCase() : String(value);
                                            const valueTextWidth = valueStr.length * baseFontSizeValue * finalSizeMultiplier * 0.6;

                                            return (
                                                <text
                                                    x={barW + 8 + valueTextWidth + 8}
                                                    y={barY + (barHeight - barInnerGap) / 2}
                                                    dy=".35em"
                                                    fontSize={baseFontSizeValue * 0.55}
                                                    fontFamily={dataFont}
                                                    fontWeight={CHART_THEME.fontWeights.medium}
                                                    letterSpacing="0.02em"
                                                    fill={delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : CHART_THEME.colors.neutral.medium}
                                                    opacity={0.65}
                                                >
                                                    {deltaText}
                                                </text>
                                            );
                                        })()}
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* Y-axis line */}
                {!isInfographic && (
                    <line
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={chartHeight}
                        stroke={CHART_THEME.colors.neutral.medium}
                        strokeWidth={CHART_THEME.strokeWidths.axis}
                        opacity={CHART_THEME.effects.axisOpacity}
                    />
                )}

                {/* Axis labels */}
                {data.xAxisLabel && (
                    <text
                        x={chartWidth / 2}
                        y={chartHeight + 25}
                        textAnchor="middle"
                        fontSize={isInfographic ? CHART_THEME.fontSizes.small * 0.8 : CHART_THEME.fontSizes.medium}
                        fontFamily={isInfographic ? dataFont : narrativeFont}
                        fontWeight={CHART_THEME.fontWeights.medium}
                        letterSpacing={isInfographic ? "0.12em" : "normal"}
                        fill={CHART_THEME.colors.neutral.medium}
                        opacity={isInfographic ? 0.35 : 1}
                    >
                        {isInfographic ? data.xAxisLabel.toUpperCase() : data.xAxisLabel}
                    </text>
                )}
                {data.yAxisLabel && (
                    <text
                        transform="rotate(-90)"
                        x={-chartHeight / 2}
                        y={-marginLeft + 15}
                        textAnchor="middle"
                        fontSize={isInfographic ? CHART_THEME.fontSizes.small * 0.8 : CHART_THEME.fontSizes.medium}
                        fontFamily={isInfographic ? dataFont : CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.medium}
                        letterSpacing={isInfographic ? "0.12em" : "normal"}
                        fill={CHART_THEME.colors.neutral.medium}
                        opacity={isInfographic ? 0.35 : 1}
                    >
                        {isInfographic ? data.yAxisLabel.toUpperCase() : data.yAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
