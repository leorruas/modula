import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createIOSGlassLineFilter, createGlassGradient, createMiniIOSGlassFilter } from '@/utils/chartTheme';
import { getMixedChartDatasetType } from '@/utils/chartHelpers';
import { ensureDistinctColors } from '@/utils/colors';
import { smartFormatChartValue } from '@/utils/formatters';

interface MixedChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function MixedChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: MixedChartProps) {
    if (!data.datasets || data.datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;
    const finalLegendPosition = style?.legendPosition || 'bottom';

    // 1. Split Datasets
    const barDatasets = data.datasets.filter((_, i) => getMixedChartDatasetType(i, data.datasets.length, style) === 'bar');
    const lineDatasets = data.datasets.filter((_, i) => getMixedChartDatasetType(i, data.datasets.length, style) === 'line');

    // 2. Calculate Ranges
    const isStacked = style?.stacked;
    const useDualAxis = (style?.useDualAxis || (data as any).useDualAxis) && lineDatasets.length > 0;

    // Calculate Max Values
    let maxValue = 0;
    let maxLineValue = 0;

    // Primary Axis Max (Bars)
    if (isStacked) {
        const stackedSums = new Array(labels.length).fill(0);
        barDatasets.forEach(ds => {
            ds.data.forEach((val, i) => {
                if (val > 0) stackedSums[i] += val;
            });
        });
        const maxStack = Math.max(...stackedSums);
        maxValue = Math.max(maxStack, 1);
    } else {
        const allBarValues = barDatasets.flatMap(d => d.data);
        maxValue = Math.max(...allBarValues, 1);
    }

    // Secondary Axis Max (Lines) OR common max if no dual axis
    const allLineValues = lineDatasets.flatMap(d => d.data);
    if (useDualAxis) {
        maxLineValue = Math.max(...allLineValues, 1);
        // Ensure some padding at top of max
        maxLineValue *= 1.1;
    } else {
        // If no dual axis, both share maxValue
        maxValue = Math.max(maxValue, ...allLineValues, 1);
        maxLineValue = maxValue;
    }
    // Ensure primary also has padding
    maxValue *= 1.1;

    // 3. Layout Dimensions & Proximity (Gestalt)
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');

    // "Breath Rule": Spacing relative to font size
    const GAP_LABEL_GRAPH = fontSize * 0.4; // Reduced from 0.5
    const GAP_TICK_LABEL = fontSize * 1.2;  // Reduced from 1.5

    // "Box Rule": Dynamic Padding
    const minPadding = isInfographic ? fontSize * 3 : fontSize * 1.5; // Reduced
    // Calculate max room needed for layout
    const dynamicMarginLeft = Math.max(minPadding, width * 0.05);
    const dynamicMarginRight = useDualAxis ? Math.max(minPadding * 1.5, width * 0.08) : Math.max(minPadding * 0.6, width * 0.05);
    const dynamicMarginTop = isInfographic ? fontSize * 3 : fontSize * 1.5; // Reduced

    const chartWidth = width - dynamicMarginLeft - dynamicMarginRight;

    // Grouping Logic (Matching ColumnChart)
    const categoryCount = labels.length;
    const groupWidth = chartWidth / Math.max(categoryCount, 1);
    const groupGap = groupWidth * 0.2; // 20% gap between groups
    const barsPerGroup = isStacked ? 1 : (barDatasets.length || 1);
    const effectiveBarGroupWidth = groupWidth - groupGap;
    const colWidth = (effectiveBarGroupWidth) / barsPerGroup;
    const colInnerGap = colWidth * 0.1;

    // Wrapping & Staggering Logic
    const charWidth = fontSize * 0.5;
    const maxCharsPerLine = Math.floor(effectiveBarGroupWidth / charWidth) || 12;
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
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);

    // Preventive Staggering ("Air Gap")
    const isDenseLayout = groupWidth < (fontSize * 8);
    const staggerBuffer = isDenseLayout ? (maxLinesNeeded * fontSize * 1.1) + GAP_TICK_LABEL : 0;
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.0) + GAP_LABEL_GRAPH + staggerBuffer;

    const chartHeight = height - dynamicMarginTop - (isInfographic ? fontSize * 1.5 : fontSize * 0.8) - labelBottomPadding;
    const effectiveBaselineY = chartHeight;

    const colorPalette = ensureDistinctColors(style?.colorPalette || [], data.datasets.length);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;

    // Legend Component (Narrative Grid)
    const Legend = finalLegendPosition !== 'none' ? (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '4px 12px', // Reduced gap
            padding: '8px', // Reduced padding
            background: isInfographic ? 'rgba(255,255,255,0.05)' : 'transparent',
            borderRadius: 8
        }}>
            {data.datasets.map((ds, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {style?.finish === 'glass' ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" style={{ overflow: 'visible' }}>
                            <g dangerouslySetInnerHTML={{ __html: createMiniIOSGlassFilter(`miniGlassMixed-${i}`) }} />
                            <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`miniGradMixed-${i}`, colorPalette[i % colorPalette.length]) }} />
                            <rect
                                x="1" y="1" width="12" height="12" rx="3"
                                fill={`url(#miniGradMixed-${i})`}
                                filter={`url(#miniGlassMixed-${i})`}
                                stroke="white" strokeWidth="0.5" strokeOpacity="0.5"
                            />
                        </svg>
                    ) : (
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: colorPalette[i % colorPalette.length] }} />
                    )}
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily }}>{ds.label}</span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="mixed" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                <filter id="mixedShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                {useGradient && colorPalette.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`mixedGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </linearGradient>
                ))}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassLineFilter('glassLineFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('glassPointFilter') }} />
                        {colorPalette.map((color, i) => (
                            <g key={`glass-grad-${i}`} dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassMixedGrad-${i}`, color) }} />
                        ))}
                    </>
                )}
            </defs>

            <g transform={`translate(${dynamicMarginLeft}, ${dynamicMarginTop})`}>
                {/* Horizontal Grid */}
                {!isInfographic && [0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={`grid-${i}`} x1={0} y1={chartHeight * (1 - f)} x2={chartWidth} y2={chartHeight * (1 - f)}
                        stroke={CHART_THEME.colors.neutral.lighter} strokeWidth={1} opacity={0.1} strokeDasharray={"4 4"} />
                ))}

                {/* Primary Y-Axis Ticks (Left) */}
                {!isInfographic && [0, 0.5, 1].map((f, i) => (
                    <text key={`ytick-p-${i}`} x={-GAP_TICK_LABEL} y={chartHeight * (1 - f)}
                        textAnchor="end" alignmentBaseline="middle"
                        fontSize={fontSize * 0.8} fill={CHART_THEME.colors.neutral.medium} fontFamily={fontFamily}>
                        {smartFormatChartValue(maxValue * f, style?.numberFormat)}
                    </text>
                ))}

                {/* Secondary Y-Axis Ticks (Right) */}
                {useDualAxis && !isInfographic && [0, 0.5, 1].map((f, i) => (
                    <text key={`ytick-s-${i}`} x={chartWidth + GAP_TICK_LABEL} y={chartHeight * (1 - f)}
                        textAnchor="start" alignmentBaseline="middle"
                        fontSize={fontSize * 0.8} fill={CHART_THEME.colors.neutral.medium} fontFamily={fontFamily}>
                        {smartFormatChartValue(maxLineValue * f, style?.secondaryNumberFormat)}
                    </text>
                ))}

                {/* Vertical Milestones / Crosshairs */}
                {isInfographic && labels.map((_, i) => {
                    const isManualHero = heroValueIndex === i;
                    if (!isManualHero && (!finalUseMetadata || !data.datasets[0]?.metadata?.[i])) return null;
                    const x = i * groupWidth + groupWidth / 2;
                    return (
                        <line key={`vguide-${i}`} x1={x} y1={0} x2={x} y2={chartHeight}
                            stroke={isManualHero ? colorPalette[0] : CHART_THEME.colors.neutral.lighter}
                            strokeWidth={isManualHero ? 1 : 0.5} opacity={isManualHero ? 0.3 : 0.1}
                            strokeDasharray={isManualHero ? undefined : "4 4"} />
                    );
                })}

                {/* Bars Rendering */}
                {labels.map((label, i) => {
                    const groupX = i * groupWidth + (groupGap / 2); // Start of group content

                    // Staggering Logic
                    const isStaggered = isDenseLayout && i % 2 !== 0;
                    const currentStaggerOffset = isStaggered ? staggerBuffer : 0;
                    const labelY = effectiveBaselineY + GAP_TICK_LABEL + currentStaggerOffset;

                    return (
                        <g key={`group-${i}`}>
                            {/* X-Axis Label */}
                            <text
                                x={i * groupWidth + groupWidth / 2}
                                y={labelY}
                                textAnchor="middle"
                                fontSize={fontSize}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic && heroValueIndex === i ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                                opacity={isInfographic && heroValueIndex !== undefined && heroValueIndex !== i ? 0.6 : 1}
                                style={{ textTransform: isInfographic ? 'uppercase' : 'none' }}
                            >
                                <title>{label}</title>
                                {wrappedLabels[i].map((line, lineIdx) => (
                                    <tspan key={lineIdx} x={i * groupWidth + groupWidth / 2} dy={lineIdx === 0 ? 0 : fontSize * 1.2}>
                                        {line}
                                    </tspan>
                                ))}
                            </text>

                            {/* Stagger Leader Line */}
                            {isStaggered && isInfographic && (
                                <line x1={i * groupWidth + groupWidth / 2} y1={effectiveBaselineY + 5} x2={i * groupWidth + groupWidth / 2} y2={labelY - fontSize}
                                    stroke={CHART_THEME.colors.neutral.medium} strokeWidth={1} strokeDasharray="2 2" opacity={0.3} />
                            )}

                            {/* Render Bars for this Group */}
                            {(() => {
                                // Stack Accumulator for this group (starts at 0)
                                let currentStackHeight = 0;

                                return barDatasets.map((ds, barDsIndex) => {
                                    // Find original index for color consistency
                                    const originalIndex = data.datasets.indexOf(ds);
                                    const value = ds.data[i] || 0;
                                    const barHeight = (value / maxValue) * chartHeight;

                                    // Layout Calculation:
                                    let x, y;
                                    if (isStacked) {
                                        // Stacked: X is centered, Y is stacked
                                        x = groupX;
                                        // Y is ChartHeight - (PreviousHeight + CurrentHeight)
                                        y = chartHeight - currentStackHeight - barHeight;
                                        // Update accumulator for next bar
                                        currentStackHeight += barHeight;
                                    } else {
                                        // Side-by-Side: X is offset, Y is bottom-aligned
                                        x = groupX + (barDsIndex * colWidth);
                                        y = chartHeight - barHeight;
                                    }

                                    const isManualHero = heroValueIndex === i;
                                    const color = colorPalette[originalIndex % colorPalette.length];

                                    return (
                                        <g key={`bar-${originalIndex}-${i}`}>
                                            <rect
                                                x={x} y={y} width={colWidth - colInnerGap} height={barHeight}
                                                fill={
                                                    style?.finish === 'glass'
                                                        ? `url(#glassMixedGrad-${originalIndex % colorPalette.length})`
                                                        : (useGradient ? `url(#mixedGrad-${originalIndex % colorPalette.length})` : color)
                                                }
                                                rx={isInfographic ? 4 : 0}
                                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.5 : 1}
                                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : (isInfographic ? undefined : undefined)}
                                            />
                                            {isInfographic && (isManualHero || finalShowAllLabels) && (
                                                <text x={x + (colWidth - colInnerGap) / 2} y={y - (fontSize * 0.5)} textAnchor="middle"
                                                    fontSize={fontSize * 0.8}
                                                    fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.bold}
                                                    fill={CHART_THEME.colors.neutral.dark} opacity={0.8}>
                                                    {smartFormatChartValue(value, style?.numberFormat)}
                                                </text>
                                            )}
                                        </g>
                                    )
                                });
                            })()}
                        </g>
                    )
                })}

                {/* Line Datasets (Figure - Rendered ON TOP) */}
                {lineDatasets.map((ds, lineDsIndex) => {
                    const originalIndex = data.datasets.indexOf(ds);
                    const color = colorPalette[originalIndex % colorPalette.length];
                    const targetMax = useDualAxis ? maxLineValue : maxValue;
                    const format = useDualAxis ? style?.secondaryNumberFormat : style?.numberFormat;

                    const linePoints = ds.data.map((value, i) => {
                        // Line points should be centered in the GROUP
                        const cx = i * groupWidth + groupWidth / 2;
                        const cy = chartHeight - ((value / targetMax) * chartHeight);
                        return { x: cx, y: cy };
                    });

                    const polylinePoints = linePoints.map(p => `${p.x},${p.y}`).join(' ');

                    return (
                        <g key={`line-ds-${originalIndex}`} filter="url(#mixedShadow)">
                            <polyline
                                fill="none" stroke={color}
                                strokeWidth={isInfographic ? 4 : 2}
                                strokeLinecap="round" strokeLinejoin="round"
                                points={polylinePoints}
                                opacity={0.9} // Slight transparency for layering
                            />
                            {linePoints.map((p, i) => {
                                const isManualHero = heroValueIndex === i;
                                const showLineLabel = isInfographic && (isManualHero || finalShowAllLabels);
                                return (
                                    <g key={`dot-${i}`}>
                                        <circle
                                            cx={p.x} cy={p.y}
                                            r={isInfographic ? (isManualHero ? 6 : 4) : 3}
                                            fill="#fff"
                                            stroke={color}
                                            strokeWidth={2}
                                        />
                                        {/* Line Labels */}
                                        {showLineLabel && (
                                            <text x={p.x} y={p.y - 12} textAnchor="middle"
                                                fontSize={fontSize * 0.9}
                                                fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black}
                                                fill={color} stroke="white" strokeWidth={3} paintOrder="stroke">
                                                {smartFormatChartValue(ds.data[i], format)}
                                            </text>
                                        )}
                                        {/* Editorial Badge for Hero in Mixed Chart */}
                                        {isInfographic && isManualHero && (
                                            <text x={p.x} y={-25} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} letterSpacing="0.1em" fill={color}>
                                                {finalAnnotationLabels?.[i]?.toUpperCase() || "DESTAQUE"}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    )
                })}

                {/* Secondary Y-Axis Label */}
                {useDualAxis && style?.y2AxisLabel && (
                    <text
                        x={chartWidth + dynamicMarginRight - 10}
                        y={chartHeight / 2}
                        textAnchor="middle"
                        transform={`rotate(90, ${chartWidth + dynamicMarginRight - 10}, ${chartHeight / 2})`}
                        fontSize={fontSize * 0.9}
                        fontFamily={fontFamily}
                        fill={CHART_THEME.colors.neutral.medium}
                        fontWeight={CHART_THEME.fontWeights.bold}
                    >
                        {style.y2AxisLabel}
                    </text>
                )}

                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.1 : 0.3} />
            </g>
        </BaseChart>
    );
}
