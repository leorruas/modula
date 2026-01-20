import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient, getChartColor } from '@/utils/chartTheme';
import { generateMonochromaticPalette, ensureDistinctColors } from '@/utils/colors';

interface DonutChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function DonutChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: DonutChartProps) {
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
    const total = values.reduce((a, b) => a + b, 0);

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;
    const finalSortSlices = infographicConfig.sortSlices || false;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';

    const padding = isInfographic ? 40 : 20;
    const outerRadius = (Math.min(width, height) / 2) - padding;
    const innerRadius = outerRadius * (isInfographic ? 0.75 : 0.6);
    const centerX = width / 2;
    const centerY = height / 2;

    const useGradient = style?.useGradient;
    const initialColors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];

    let colors = initialColors;
    if (values.length > colors.length) {
        if (colors.length === 1) {
            colors = generateMonochromaticPalette(colors[0], values.length);
        } else {
            colors = ensureDistinctColors(colors, values.length);
        }
    }

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    let startAngle = 0;

    // Wrapping logic for external labels
    const wrapLabel = (text: string, maxChars: number = 15) => {
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

    // Refined Legend Component with Grid and Wrapping (Consistency with PieChart)
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
        <BaseChart width={width} height={height} data={data} type="donut" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {useGradient && colors.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`donutGradient-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </radialGradient>
                ))}
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
                    const isManualHero = heroValueIndex === originalIndices[i];

                    // Variable Thickness Logic
                    // Instead of moving the center (explosion), we change the inner radius.
                    // Heavier weight = Thicker slice (Smaller inner radius).
                    let currentInnerRadius = innerRadius;

                    if (isInfographic) {
                        const maxValue = Math.max(...values);
                        const weight = value / maxValue;

                        // Define thickness range
                        // maxThickness: Slice goes deep into the center (small inner radius)
                        // minThickness: Slice is thin (large inner radius)

                        const baseOuterRadius = outerRadius;
                        // ADJUSTMENT: Refined Editorial Contrast (User Feedback)
                        // Thickest: 0.7 (Balanced thickness)
                        // Thinnest: 0.99 (Ultra-thin Hairline)
                        const minHoleRadius = baseOuterRadius * 0.7;
                        const maxHoleRadius = baseOuterRadius * 0.99;

                        // Linear interpolation: High weight -> Small Hole (Thick)
                        // weight 1.0 -> minHoleRadius
                        // weight 0.0 -> maxHoleRadius
                        currentInnerRadius = maxHoleRadius - (weight * (maxHoleRadius - minHoleRadius));

                        // Optional: If it's a manual hero, maybe we give it a slight thickness boost or ensure it's not too thin?
                        // For now, strictly following "according to weight".
                    }

                    // No explosion offset for center
                    const ex = 0;
                    const ey = 0;

                    const x1 = outerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = outerRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = outerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = outerRadius * Math.sin(endAngle - Math.PI / 2);

                    // Use currentInnerRadius for the inner arc
                    const x3 = currentInnerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y3 = currentInnerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x4 = currentInnerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y4 = currentInnerRadius * Math.sin(startAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${currentInnerRadius} ${currentInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        `Z`
                    ].join(' ');

                    const percentage = ((value / total) * 100).toFixed(1);
                    const labelAngle = startAngle + sliceAngle / 2;

                    // Gestalt Proximity & Alignment Logic
                    const normalizedAngle = labelAngle % (2 * Math.PI);
                    const isRightSide = normalizedAngle < Math.PI;
                    const isTop = normalizedAngle > 5.2 || normalizedAngle < 1.1;
                    const isBottom = normalizedAngle > 2.0 && normalizedAngle < 4.2;

                    // Editorial specific anchors
                    let textAnchor: "start" | "end" | "middle" = "middle";
                    if (isInfographic) {
                        if (isTop || isBottom) textAnchor = "middle";
                        else textAnchor = isRightSide ? "start" : "end";
                    }

                    // Radii for Proximity Layering
                    // Value enters the graph (Overlap), Label sits outside
                    // INCREASED SEPARATION to prevent "label under number" overlap
                    const valueR = isInfographic ? outerRadius - 20 : (outerRadius + currentInnerRadius) / 2;
                    // RELAXED DISTANCE (+35)
                    const labelTextR = isInfographic ? outerRadius + 35 : (outerRadius + currentInnerRadius) / 2;

                    // Calculate positions for Value (vx, vy) and Label (lx, ly)
                    const vx = valueR * Math.cos(labelAngle - Math.PI / 2);
                    const vy = valueR * Math.sin(labelAngle - Math.PI / 2);

                    const lx = labelTextR * Math.cos(labelAngle - Math.PI / 2);
                    const ly = labelTextR * Math.sin(labelAngle - Math.PI / 2);

                    const currentStartAngle = startAngle;
                    startAngle += sliceAngle;

                    const shouldShowLabel = finalShowAllLabels || !isInfographic || (value / total >= 0.05) || isManualHero;
                    const wrappedLabelLines = isInfographic ? wrapLabel(labels[i]) : [labels[i]];

                    return (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={
                                    style?.finish === 'glass'
                                        ? `url(#glassGradient-${i % colors.length})`
                                        : (useGradient ? `url(#donutGradient-${i % colors.length})` : colors[i % colors.length])
                                }
                                // REMOVED SHADOW FILTER for flat look
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                                stroke={style?.finish === 'glass' ? "none" : "#fff"}
                                strokeWidth={isInfographic ? (isManualHero ? 1 : 0.5) : 1}
                                strokeLinejoin="round"
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.7 : 1}
                            />

                            {shouldShowLabel && (
                                <g>
                                    {isInfographic ? (
                                        <g>
                                            {/* Badge for Extremes or Metadata */}
                                            {(() => {
                                                let bt = ""; let bc = CHART_THEME.colors.neutral.medium; let sb = false;
                                                if (finalShowValueAnnotations && isManualHero) {
                                                    bt = finalAnnotationLabels?.[i] !== undefined ? finalAnnotationLabels[i] : "DESTAQUE";
                                                    sb = bt !== "";
                                                }
                                                else if (finalUseMetadata && metadata && metadata[i]) { bt = metadata[i]; bc = colors[i % colors.length]; sb = true; }
                                                else if (finalShowExtremes && !isManualHero) {
                                                    const maxV = Math.max(...values);
                                                    const minV = Math.min(...values);
                                                    if (value === maxV) { bt = "🏆 PICO"; bc = '#d97706'; sb = true; }
                                                    else if (value === minV) { bt = "🔻 MÍNIMO"; bc = '#ef4444'; sb = true; }
                                                }
                                                if (!sb) return null;
                                                // Badge sits above value
                                                return (
                                                    <text x={vx} y={vy - 24} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                        fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} letterSpacing="0.05em" fill={bc}>
                                                        {bt.toUpperCase()}
                                                    </text>
                                                );
                                            })()}

                                            {/* Value (Inside/Overlap) */}
                                            {/* Top Nudge increased to -12 */}
                                            <text
                                                x={vx}
                                                y={vy + (isTop ? -12 : 0)}
                                                textAnchor={textAnchor}
                                                dominantBaseline="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true) * (isManualHero ? 1.2 : 0.9)}
                                                fontFamily={valueFont}
                                                fontWeight={CHART_THEME.fontWeights.black}
                                                fill={CHART_THEME.colors.neutral.dark}
                                            // REMOVED TEXT SHADOW
                                            >
                                                {percentage}%
                                            </text>

                                            {/* Label (Outside, Aligned) */}
                                            {wrappedLabelLines.map((line, idx) => {
                                                // Dynamic Vertical Offset based on position to prevent overlap
                                                // Top: Push UP (negative)
                                                // Bottom: Push DOWN (positive)
                                                // Side: Centered (0)
                                                let vOffset = 0;
                                                if (isTop) vOffset = -15 - (wrappedLabelLines.length * 5); // Lift more if multi-line
                                                if (isBottom) vOffset = 15;

                                                return (
                                                    <text
                                                        key={idx}
                                                        x={lx}
                                                        y={ly + (idx * 12) + vOffset}
                                                        textAnchor={textAnchor}
                                                        dominantBaseline="middle"
                                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                        fontFamily={fontFamily}
                                                        fontWeight={isManualHero ? CHART_THEME.fontWeights.bold : CHART_THEME.fontWeights.medium}
                                                        fill={CHART_THEME.colors.neutral.medium}
                                                        style={{ textTransform: 'uppercase' }}
                                                    >
                                                        {line}
                                                    </text>
                                                );
                                            })}
                                        </g>
                                    ) : (
                                        <g transform={`translate(${lx}, ${ly})`}>
                                            <text
                                                textAnchor="middle"
                                                alignmentBaseline="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                                fontFamily={fontFamily}
                                                fill="#fff"
                                                fontWeight={CHART_THEME.fontWeights.semibold}
                                            >
                                                {`${percentage}%`}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            )}
                        </g>
                    );
                })}
                {/* Center Hero Narrative (Rendered LAST for Z-Index Top) */}
                {isInfographic && (
                    <g pointerEvents="none">
                        {heroValueIndex !== undefined ? (
                            <>
                                <text y={-innerRadius * 0.4} textAnchor="middle" dominantBaseline="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                    fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.1em">
                                    {labels.length > 0 && heroValueIndex < (data.labels || []).length ? (data.labels || [])[heroValueIndex]?.toUpperCase() : "HERO"}
                                </text>
                                <text y={5} textAnchor="middle" dominantBaseline="middle" fontSize={innerRadius * 0.5}
                                    fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                    {((dataset.data[heroValueIndex] / total) * 100).toFixed(0)}%
                                </text>
                                <text y={innerRadius * 0.4} textAnchor="middle" dominantBaseline="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                    fontFamily={valueFont} fill={CHART_THEME.colors.neutral.medium}>
                                    {dataset.data[heroValueIndex]}
                                </text>
                            </>
                        ) : (
                            <>
                                <text y={-innerRadius * 0.35} textAnchor="middle" dominantBaseline="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                    fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.1em">
                                    TOTAL
                                </text>
                                <text y={10} textAnchor="middle" dominantBaseline="middle" fontSize={innerRadius * 0.6}
                                    fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                    {total}
                                </text>
                            </>
                        )}
                    </g>
                )}
            </g>
        </BaseChart>
    );
}
