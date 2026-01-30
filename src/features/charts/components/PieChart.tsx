import { ChartData, ChartStyle, GridConfig } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { useSmartLayout } from '@/hooks/useSmartLayout';
import { ComputedLayout } from '@/services/smartLayout/types';
import { smartFormatChartValue } from '@/utils/formatters';

interface PieChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
    gridConfig?: GridConfig;
    computedLayout?: ComputedLayout;
}

export function PieChart({
    width,
    height,
    data,
    style,
    baseFontSize = 11,
    baseFontUnit = 'pt',
    gridConfig,
    computedLayout: propsComputedLayout
}: PieChartProps) {
    // 1. Hook into Smart Layout Engine
    const smartLayout = useSmartLayout(
        { type: 'pie', data, style },
        gridConfig || { baseFontSize } as GridConfig,
        { w: width, h: height }
    );

    const layout = propsComputedLayout || smartLayout;
    // 2. Extract Geometry from Engine
    const {
        centerX = width / 2,
        centerY = height / 2,
        outerRadius = 0,
        innerRadius = 0,
        datasetColors,
        labelPlacements, // Array of { x, y, textAnchor, strategy, sliceIndex, measure, ... }
        spiderLegs,      // Array of { points, labelX, labelY, ... }
        slices           // Array of { startAngle, endAngle, color, value, percent, originalIndex }
    } = layout.typeSpecific || {};

    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0 || !centerX) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    // Geometry check
    if (!slices || slices.length === 0) {
        // Fallback or loading state if engine fails for some reason
        return null;
    }

    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalShowDeltaPercent = infographicConfig.showDeltaPercent || false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;

    const colors = datasetColors || style?.colorPalette || ['#333'];
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;

    // Avg/Max for badges
    const total = dataset.data.reduce((a, b) => a + b, 0);
    const avgValue = total / (dataset.data.length || 1);
    const maxValue = Math.max(...dataset.data);
    const minValue = Math.min(...dataset.data);

    // Legend Component (Simplified extraction)
    const Legend = finalLegendPosition !== 'none' && dataset.data.length > 0 ? (
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
                {/* 1. Slices Rendering */}
                {slices.map((slice, i) => {
                    const { startAngle, endAngle, value, originalIndex } = slice;

                    const x1 = outerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = outerRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = outerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = outerRadius * Math.sin(endAngle - Math.PI / 2);

                    const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;

                    const pathData = [
                        `M 0 0`,
                        `L ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `Z`
                    ].join(' ');

                    const isManualHero = heroValueIndex !== undefined && heroValueIndex === originalIndex;

                    // Explosion logic for Hero (if desired, needs manual offset)
                    // Currently omitted to ensure label stability with Engine logic
                    // If we want explosion, we should modify transform group, but Engine calculated labels based on (0,0) center.
                    // Explosion moves everything by (ox, oy). Layout Engine assumes center.
                    // We stick to standard circle for now.

                    return (
                        <path
                            key={i}
                            d={pathData}
                            fill={style?.finish === 'glass' ? `url(#glassGradient-${originalIndex % colors.length})` : (useGradient ? `url(#pieGradient-${originalIndex % colors.length})` : colors[originalIndex % colors.length])}
                            filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                            stroke={style?.finish === 'glass' ? "none" : "#fff"}
                            strokeWidth={isInfographic ? (isManualHero ? 2 : 0.5) : 1.5}
                            strokeLinejoin="round"
                            opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.6 : 1}
                        />
                    );
                })}

                {/* 2. Spider Legs */}
                {spiderLegs?.map((leg, idx) => (
                    <polyline
                        key={`leg-${idx}`}
                        points={leg.points.join(' ')}
                        fill="none"
                        stroke={CHART_THEME.colors.neutral.medium}
                        strokeWidth={0.5}
                        strokeDasharray="2,2"
                    />
                ))}

                {/* 3. Labels */}
                {labelPlacements?.map((placement, idx) => {
                    if (placement.strategy === 'hidden') return null;

                    const { x, y, textAnchor, color, sliceIndex, measure, strategy } = placement;
                    const originalIndex = slices[sliceIndex]?.originalIndex ?? sliceIndex;
                    const value = slices[sliceIndex]?.value;
                    const labelText = labels[originalIndex] || '';

                    const isInternal = strategy === 'internal';

                    // Use measure.wrappedLines from engine
                    const lines = measure?.wrappedLines || [];

                    // Determine typography
                    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
                    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInternal ? 'huge' : 'tiny', true);

                    // Value Formatted
                    const formattedValue = style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number'
                        ? smartFormatChartValue(value, style.numberFormat)
                        : (measure?.formattedValue || `${((value / total) * 100).toFixed(1)}%`);

                    // Badge Logic (if needed)
                    // (Simplified logic here similar to Donut logic)
                    const isManualHero = heroValueIndex === originalIndex;
                    let badgeText = "";
                    if (finalShowValueAnnotations && isManualHero) badgeText = finalAnnotationLabels?.[originalIndex] || "HERO";
                    else if (finalShowExtremes && !isManualHero) {
                        if (value === maxValue && value > avgValue) badgeText = "🏆";
                        else if (value === minValue && value < avgValue) badgeText = "🔻";
                    }

                    return (
                        <g key={idx}>
                            {/* Badge (only if external or enough space) */}
                            {badgeText && !isInternal && (
                                <text x={x} y={y - (measure?.totalHeight ?? 20) / 2 - 10} textAnchor={textAnchor} fontSize={fontSize * 0.6} fill={color} fontWeight="bold">
                                    {badgeText}
                                </text>
                            )}

                            {/* Main Label Group */}
                            <text
                                x={x}
                                y={y - (measure?.totalHeight ?? 24) / 2 + (fontSize * 0.8)}
                                textAnchor={textAnchor}
                                fontFamily={valueFont}
                                fill={isInternal ? color : CHART_THEME.colors.neutral.dark}
                            >
                                {/* 1. The Value (Bold/Large) */}
                                <tspan x={x} fontSize={fontSize} fontWeight={CHART_THEME.fontWeights.black}>
                                    {formattedValue}
                                </tspan>

                                {/* 2. The Category lines (Regular/Small) */}
                                {lines.map((line: string, i: number) => (
                                    <tspan
                                        key={i}
                                        x={x}
                                        dy={14} // Line height for category
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                        fontFamily={fontFamily}
                                        fontWeight={400} // Regular
                                        style={{ textTransform: 'uppercase', opacity: isInternal ? 0.8 : 0.7 }}
                                    >
                                        {line}
                                    </tspan>
                                ))}
                            </text>

                            {/* Delta Percent (if enabled and space permits) */}
                            {finalShowDeltaPercent && !isInternal && (
                                <text x={x} y={y + (measure?.totalHeight ?? 20) / 2 + 10} textAnchor={textAnchor} fontSize={fontSize * 0.5} fill={value >= avgValue ? '#10b981' : '#ef4444'}>
                                    ({value >= avgValue ? '↑' : '↓'}{Math.abs(((value - avgValue) / (avgValue || 1)) * 100).toFixed(0)}%)
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
