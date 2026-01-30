import { ChartData, ChartStyle, GridConfig } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { useSmartLayout } from '@/hooks/useSmartLayout';
import { ComputedLayout } from '@/services/smartLayout/types';
import { smartFormatChartValue } from '@/utils/formatters';

interface DonutChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
    gridConfig?: GridConfig;
    computedLayout?: ComputedLayout;
}

export function DonutChart({
    width,
    height,
    data,
    style,
    baseFontSize = 11,
    baseFontUnit = 'pt',
    gridConfig,
    computedLayout: propsComputedLayout
}: DonutChartProps) {
    // 1. Hook into Smart Layout Engine
    const smartLayout = useSmartLayout(
        { type: 'donut', data, style },
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
        innerRadii = [],
        datasetColors,
        labelPlacements, // Array of { x, y, textAnchor, strategy, sliceIndex, measure, ... }
        spiderLegs,      // Array of { points, labelX, labelY, ... }
        slices           // Visual Geometry
    } = layout.typeSpecific || {};

    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0 || !centerX) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    if (!slices || slices.length === 0) return null;

    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';
    const total = dataset.data.reduce((a, b) => a + b, 0);

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    // const finalShowExtremes = infographicConfig.showExtremes || false; 
    // const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';

    const useGradient = style?.useGradient;
    const colors = datasetColors || style?.colorPalette || ['#333'];
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;

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
                        width: 10, height: 10, marginTop: 4, flexShrink: 0, borderRadius: 2, background: colors[i % colors.length]
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
            </defs>

            <g transform={`translate(${centerX}, ${centerY})`}>
                {/* 1. Slices Rendering using Engine Geometry */}
                {slices.map((slice, i) => {
                    const { startAngle, endAngle, value, originalIndex } = slice;

                    const currentInnerRadius = innerRadii?.[i] || innerRadius;

                    const x1 = outerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = outerRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = outerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = outerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x3 = currentInnerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y3 = currentInnerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x4 = currentInnerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y4 = currentInnerRadius * Math.sin(startAngle - Math.PI / 2);

                    const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${currentInnerRadius} ${currentInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        `Z`
                    ].join(' ');

                    const isManualHero = heroValueIndex === originalIndex;

                    return (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={useGradient ? `url(#donutGradient-${originalIndex % colors.length})` : colors[originalIndex % colors.length]}
                                stroke="#fff"
                                strokeWidth={isInfographic ? (isManualHero ? 1 : 0.5) : 1}
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.7 : 1}
                            />
                        </g>
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

                    // Badge Logic
                    const isManualHero = heroValueIndex === originalIndex;
                    const badgeText = (finalShowValueAnnotations && isManualHero) ? (finalAnnotationLabels?.[originalIndex] || "DESTAQUE") : "";

                    const isInternal = strategy === 'internal';
                    const lines = measure?.wrappedLines || [];

                    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInternal ? 'huge' : 'tiny', true);

                    const formattedValue = style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number'
                        ? smartFormatChartValue(value, style.numberFormat)
                        : (measure?.formattedValue || `${((value / total) * 100).toFixed(1)}%`);

                    return (
                        <g key={idx}>
                            {/* Value Badge (Optional) */}
                            {badgeText && (
                                <text x={x} y={y - (measure?.totalHeight ?? 24) / 2 - 12} textAnchor={textAnchor} fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                    fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium}>
                                    {badgeText.toUpperCase()}
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
                        </g>
                    );
                })}

                {/* 4. Center Hero Narrative (Improved Typography & Wrapping) */}
                {isInfographic && innerRadius > 0 && (() => {
                    const heroText = heroValueIndex !== undefined ? labels[heroValueIndex] : (dataset.label || "TOTAL");
                    const heroValueText = heroValueIndex !== undefined
                        ? (style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number'
                            ? smartFormatChartValue(dataset.data[heroValueIndex], style.numberFormat)
                            : `${((dataset.data[heroValueIndex] / total) * 100).toFixed(1)}%`)
                        : smartFormatChartValue(total, style?.numberFormat);

                    // Simplified dynamic wrapping for center
                    const maxCharsPerLine = Math.floor(innerRadius / (baseFontSize * 0.4));
                    const words = (heroText || "").toUpperCase().split(/\s+/);
                    const wrappedLines: string[] = [];
                    let currentLine = "";

                    words.forEach(word => {
                        if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
                            currentLine = (currentLine + " " + word).trim();
                        } else {
                            if (currentLine) wrappedLines.push(currentLine);
                            currentLine = word;
                        }
                    });
                    if (currentLine) wrappedLines.push(currentLine);

                    // Limit to 2 lines for center to avoid vertical overflow
                    const displayLines = wrappedLines.slice(0, 2);

                    return (
                        <g pointerEvents="none">
                            {/* The Big Number (Value) */}
                            <text
                                y={heroValueIndex !== undefined ? 5 : 8}
                                textAnchor="middle"
                                fontSize={heroValueIndex !== undefined ? innerRadius * 0.35 : innerRadius * 0.55}
                                style={{ letterSpacing: '-0.02em' }}
                                fontFamily={valueFont}
                                fontWeight={CHART_THEME.fontWeights.extraBold || 800}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {heroValueText}
                            </text>

                            {/* The Label (Category or "Total") */}
                            {displayLines.map((line, i) => (
                                <text
                                    key={i}
                                    y={heroValueIndex !== undefined
                                        ? (-innerRadius * 0.45 + (i * 12)) // Above if hero
                                        : (innerRadius * 0.55 + 10 + (i * 12)) // Below if total
                                    }
                                    textAnchor="middle"
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                    fontFamily={fontFamily}
                                    fontWeight={600}
                                    fill={CHART_THEME.colors.neutral.medium}
                                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                >
                                    {line}
                                </text>
                            ))}
                        </g>
                    );
                })()}
            </g>
        </BaseChart>
    );
}
