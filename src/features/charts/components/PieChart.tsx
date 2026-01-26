import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { generateMonochromaticPalette, ensureDistinctColors } from '@/utils/colors';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { smartFormatChartValue } from '@/utils/formatters';

interface PieChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function PieChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: PieChartProps) {
    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    // Data Preparation & Sorting
    let values = [...dataset.data];
    let labels = [...(data.labels || [])];
    let metadata = dataset.metadata ? [...dataset.metadata] : undefined;
    let originalIndices = values.map((_, i) => i);

    if (style?.infographicConfig?.sortSlices) {
        const indices = values.map((_, i) => i);
        indices.sort((a, b) => values[b] - values[a]); // Descending

        values = indices.map(i => dataset.data[i]);
        labels = indices.map(i => (data.labels || [])[i]);
        if (metadata) {
            const originalMeta = dataset.metadata!;
            metadata = indices.map(i => originalMeta[i]);
        }
        originalIndices = indices;
    }

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
    const finalShowAllLabels = infographicConfig.showAllLabels || false;
    const finalSortSlices = infographicConfig.sortSlices || false;

    const total = values.reduce((a, b) => a + b, 0);
    const avgValue = total / (values.length || 1);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, Infinity);

    // Infographic needs space for wrapped external labels (approx 80px). Classic uses internal labels (10px padding).
    const padding = isInfographic ? 60 : CHART_THEME.padding.small;
    const baseRadius = (Math.min(width, height) / 2) - padding;
    const centerX = width / 2;
    const centerY = height / 2;

    let colors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];
    if (values.length > colors.length) {
        if (colors.length === 1) {
            colors = generateMonochromaticPalette(colors[0], values.length);
        } else {
            colors = ensureDistinctColors(colors, values.length);
        }
    }
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const dataFont = isInfographic ? (CHART_THEME.fonts.data || CHART_THEME.fonts.number || 'sans-serif') : (CHART_THEME.fonts.number || 'sans-serif');
    const useGradient = style?.useGradient;

    let startAngle = 0;

    // Wrapping logic for external labels
    const wrapLabel = (text: string, maxChars: number = 18) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let cur = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            if ((cur + ' ' + words[i]).length <= maxChars) {
                cur += ' ' + words[i];
            } else {
                lines.push(cur);
                cur = words[i];
            }
        }
        lines.push(cur);
        return lines.slice(0, 3);
    };

    // Refined Legend Component with Grid and Wrapping
    const Legend = finalLegendPosition !== 'none' && values.length > 0 ? (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px 16px',
            justifyContent: 'center',
            padding: '12px',
            background: isInfographic ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderRadius: 8,
            width: '90%',
            maxWidth: width - 40,
            margin: '0 auto'
        }}>
            {labels.map((label, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
                    <div style={{
                        width: 10, height: 10, marginTop: 4, flexShrink: 0, borderRadius: 2, background: colors[i % colors.length],
                        ...(style?.finish === 'glass' && {
                            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(0,0,0,0.1))',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        })
                    }} />
                    <span style={{
                        fontSize: getScaledFont(baseFontSize, baseFontUnit, 'tiny'),
                        color: '#444',
                        fontFamily,
                        lineHeight: 1.3,
                        fontWeight: CHART_THEME.fontWeights.medium
                    }}>
                        {label}
                    </span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="pie" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {useGradient && colors.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`pieGradient-${i}`} cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="70%" stopColor={color} stopOpacity="0.85" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </radialGradient>
                ))}
                {/* Glass Definitions */}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        {colors.map((color, i) => (
                            <g key={`glass-grad-${i}`} dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-${i}`, color) }} />
                        ))}
                    </>
                )}
            </defs>
            <g transform={`translate(${centerX}, ${centerY})`}>
                {values.map((value, i) => {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;
                    const labelAngle = startAngle + sliceAngle / 2;

                    // Proportional Scaling (Variable Radius / Rose Effect)
                    // Min Radius: 15% (Slightly increased from 10% for better vis) | Max Radius: 100%
                    const ratio = value / maxValue;
                    const dynamicRadius = isInfographic ? baseRadius * (0.15 + (0.85 * ratio)) : baseRadius;

                    // Hero Explosion (Phase 2)
                    const isManualHero = heroValueIndex !== undefined && heroValueIndex === originalIndices[i];
                    const explodeOffset = isInfographic && isManualHero ? 10 : 0;
                    const ox = explodeOffset * Math.cos(labelAngle - Math.PI / 2);
                    const oy = explodeOffset * Math.sin(labelAngle - Math.PI / 2);

                    const x1 = dynamicRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = dynamicRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = dynamicRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = dynamicRadius * Math.sin(endAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M 0 0`,
                        `L ${x1} ${y1}`,
                        `A ${dynamicRadius} ${dynamicRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `Z`
                    ].join(' ');

                    const percentage = ((value / total) * 100).toFixed(1);

                    const getTypographyForValue = (ratio: number) => {
                        if (!isInfographic) return { fontWeight: CHART_THEME.fontWeights.semibold, sizeMultiplier: 1 };
                        if (ratio >= 0.8) return { fontWeight: CHART_THEME.fontWeights.black, sizeMultiplier: 2.0 };
                        if (ratio >= 0.5) return { fontWeight: CHART_THEME.fontWeights.semibold, sizeMultiplier: 1.5 };
                        return { fontWeight: CHART_THEME.fontWeights.normal, sizeMultiplier: 1.0 };
                    };
                    const typo = getTypographyForValue(ratio);

                    const finalSizeMultiplier = isManualHero ? typo.sizeMultiplier * 1.2 : typo.sizeMultiplier;

                    // Gestalt Proximity & Alignment Logic (Local to this slice loop)
                    const normalizedAngle = labelAngle % (2 * Math.PI);
                    const isRightSide = normalizedAngle < Math.PI;
                    const isTop = normalizedAngle > 5.2 || normalizedAngle < 1.1;
                    const isBottom = normalizedAngle > 2.0 && normalizedAngle < 4.2;

                    let textAnchor: "start" | "end" | "middle" = "middle";
                    if (isTop || isBottom) textAnchor = "middle";
                    else textAnchor = isRightSide ? "start" : "end";

                    // Hybrid Label Positioning (Smart Callout)
                    // If ratio < 0.4 (small slice), force label to OUTER RIM (baseRadius + 35)
                    // If ratio >= 0.4 (large slice), track the radius (dynamicRadius + 20)
                    const isSmallSlice = ratio < 0.4;

                    // Value stays with the slice
                    const valueR = dynamicRadius - 25;

                    // Label jumps out if small slice to avoid center clutter overlap
                    const labelTextR = isSmallSlice
                        ? baseRadius + 35
                        : dynamicRadius + 20;

                    const vx = (valueR + explodeOffset) * Math.cos(labelAngle - Math.PI / 2);
                    const vy = (valueR + explodeOffset) * Math.sin(labelAngle - Math.PI / 2);
                    const lx = (labelTextR + explodeOffset) * Math.cos(labelAngle - Math.PI / 2);
                    const ly = (labelTextR + explodeOffset) * Math.sin(labelAngle - Math.PI / 2);

                    const wrappedLabelLines = isInfographic ? wrapLabel(labels[i]) : [labels[i]];
                    const shouldShowLabelBody = finalShowAllLabels || !isInfographic || (value / total >= 0.05) || isManualHero;

                    startAngle += sliceAngle;

                    return (
                        <g key={i} transform={`translate(${ox}, ${oy})`}>
                            <path
                                d={pathData}
                                fill={style?.finish === 'glass' ? `url(#glassGradient-${i % colors.length})` : (useGradient ? `url(#pieGradient-${i % colors.length})` : colors[i % colors.length])}
                                // REMOVED FILTER
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                                stroke={style?.finish === 'glass' ? "none" : "#fff"}
                                strokeWidth={isInfographic ? (isManualHero ? 2 : 0.5) : 1.5}
                                strokeLinejoin="round"
                                opacity={isInfographic && !isManualHero && heroValueIndex !== undefined ? 0.6 : 1}
                            />

                            {shouldShowLabelBody && (
                                <>
                                    {isInfographic ? (
                                        <>
                                            {/* Annotation Badge (Phase 2 & 3) */}
                                            {(() => {
                                                let badgeText = "";
                                                let badgeColor = CHART_THEME.colors.neutral.medium;
                                                let showBadge = false;

                                                if (finalShowValueAnnotations && isManualHero) {
                                                    badgeText = finalAnnotationLabels?.[i] || "HERO";
                                                    showBadge = true;
                                                } else if (finalUseMetadata && metadata && metadata[i]) {
                                                    badgeText = metadata[i];
                                                    badgeColor = colors[i % colors.length];
                                                    showBadge = true;
                                                } else if (finalShowExtremes && !isManualHero) {
                                                    if (value === maxValue && value > avgValue) {
                                                        badgeText = "🏆 LÍDER";
                                                        badgeColor = '#d97706';
                                                        showBadge = true;
                                                    } else if (value === minValue && value < avgValue) {
                                                        badgeText = "🔻 MIN";
                                                        badgeColor = '#ef4444';
                                                        showBadge = true;
                                                    }
                                                }

                                                if (!showBadge) return null;

                                                return (
                                                    <text
                                                        x={lx} y={ly - 45} textAnchor="middle"
                                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                        fontFamily={dataFont} fontWeight={CHART_THEME.fontWeights.black}
                                                        letterSpacing="0.1em" fill={badgeColor} opacity={0.8}
                                                    >
                                                        {badgeText.toUpperCase()}
                                                    </text>
                                                );
                                            })()}

                                            {/* Percentage */}
                                            {/* Top Value Nudge: -10 */}
                                            {/* Percentage or Formatted Value */}
                                            {/* Top Value Nudge: -10 */}
                                            <text
                                                x={vx} y={vy - 15 + (isTop ? -10 : 0)}
                                                textAnchor="middle" dominantBaseline="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true) * finalSizeMultiplier * (style?.numberFormat?.type === 'currency' ? 0.5 : 0.7)}
                                                fontFamily={CHART_THEME.fonts.number} fontWeight={typo.fontWeight}
                                                fill={CHART_THEME.colors.neutral.dark}
                                            >
                                                {style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number'
                                                    ? smartFormatChartValue(value, style.numberFormat)
                                                    : `${percentage}%`
                                                }
                                            </text>

                                            {/* Label with Wrapping */}
                                            {wrappedLabelLines.map((line, idx) => {
                                                let vOffset = 0;
                                                if (isTop) vOffset = -15 - (wrappedLabelLines.length * 5);
                                                if (isBottom) vOffset = 15;

                                                return (
                                                    <text
                                                        key={idx}
                                                        x={lx} y={ly + 8 + (idx * 12) + vOffset} textAnchor="middle"
                                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                                        fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.medium}
                                                        fill={CHART_THEME.colors.neutral.medium}
                                                        style={{ textTransform: ratio >= 0.8 ? 'uppercase' : 'none' }}
                                                    >
                                                        {line}
                                                        {idx === wrappedLabelLines.length - 1 && finalShowDeltaPercent && (
                                                            <tspan dx={5} fontSize="0.8em" fill={value >= avgValue ? '#10b981' : '#ef4444'}>
                                                                ({value >= avgValue ? '↑' : '↓'}{Math.abs(((value - avgValue) / (avgValue || 1)) * 100).toFixed(0)}%)
                                                            </tspan>
                                                        )}
                                                    </text>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <text
                                            x={lx} y={ly} textAnchor="middle" alignmentBaseline="middle"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                            fontFamily={fontFamily} fill="#fff" fontWeight={CHART_THEME.fontWeights.semibold}
                                        >
                                            {`${labels[i]}\n${style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number' ? smartFormatChartValue(value, style.numberFormat) : `${percentage}%`}`}
                                        </text>
                                    )}
                                </>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
