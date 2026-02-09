import React from 'react';
import { ChartData, ChartStyle, GridConfig } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont } from '@/utils/chartTheme';
import { IOSGlassFilter, GlassGradient } from './ChartFilters';
import { useSmartLayout } from '@/hooks/useSmartLayout';
import { ComputedLayout } from '@/services/smartLayout/types';
import { smartFormatChartValue } from '@/utils/formatters';
import { getContrastColor, adjustBrightness } from '@/utils/colors';

// Helper for infographic scaling
const getTypographyForTreemap = (isHero: boolean, isInfographic: boolean, isInternal: boolean) => {
    if (!isInfographic) return { fontWeight: 600, sizeMultiplier: 1, textTransform: 'none' as const };
    if (isHero) return { fontWeight: 900, sizeMultiplier: isInternal ? 4.5 : 2.2, textTransform: 'uppercase' as const };
    return { fontWeight: 700, sizeMultiplier: 1.3, textTransform: 'uppercase' as const };
};

interface TreemapChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
    gridConfig?: GridConfig;
    computedLayout?: ComputedLayout;
}

export function TreemapChart({
    width,
    height,
    data,
    style,
    baseFontSize = 11,
    baseFontUnit = 'pt',
    gridConfig: propsGridConfig,
    computedLayout: propsComputedLayout
}: TreemapChartProps) {
    const gridConfig = propsGridConfig || { baseFontSize } as GridConfig;

    const stableId = React.useMemo(() => `tm-${Math.floor(Math.random() * 10000)}`, []);


    // 1. Hook into Smart Layout Engine
    const smartLayout = useSmartLayout(
        { type: 'treemap', data, style },
        gridConfig,
        { w: width, h: height }
    );

    const layout = propsComputedLayout || smartLayout; // FASE 2: Engine Integration

    // 2. Extract Geometry from Engine
    const { margins, typeSpecific } = layout; // Destructure margins to compute smart dims
    const {
        treemapPositions = [],
        datasetColors
    } = typeSpecific || {};

    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0 || treemapPositions.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';
    const infographicConfig = style?.infographicConfig || {};
    const finalLegendPosition = infographicConfig.legendPosition || 'none';

    const colors = datasetColors || style?.colorPalette || CHART_THEME.colors.primary;
    const fontFamily = 'Inter, -apple-system, sans-serif';
    const useGradient = style?.useGradient;

    // FASE 1.4: Layout Standardization (Match BarChart)
    // Calculate logical internal dimensions for SVG viewBox
    const marginTop = margins.top;
    const marginRight = margins.right;
    const marginBottom = margins.bottom;
    const marginLeft = margins.left;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    // Legend Component (Optional for Treemap)
    const Legend = finalLegendPosition !== 'none' && dataset.data.length > 0 ? (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            justifyContent: 'center',
            padding: '12px',
            width: '100%'
        }}>
            {labels.map((label: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 10, height: 10, flexShrink: 0, borderRadius: 2, background: colors[i % colors.length],
                        ...(style?.finish === 'glass' && {
                            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(0,0,0,0.1))',
                            border: '1px solid rgba(255,255,255,0.8)',
                        })
                    }} />
                    <span style={{
                        fontSize: getScaledFont(baseFontSize, baseFontUnit, 'tiny'),
                        color: '#666',
                        fontFamily,
                        lineHeight: 1
                    }}>
                        {label}
                    </span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} chartWidth={width} chartHeight={height} data={data} type="treemap" legend={Legend} legendPosition={finalLegendPosition}>
            {/* 0. Background Layer (Critical for Export) */}
            {/* Fixes blank PDF issue by providing a solid base for glass/transparency synthesis during rasterization */}
            <rect x={0} y={0} width={width} height={height} fill="white" fillOpacity={isInfographic ? 0 : 1} />

            <defs>
                {/* Glass Definitions */}
                {style?.finish === 'glass' && (
                    <>
                        <IOSGlassFilter id={`treemap-glass-filter-${stableId}`} />
                        {colors.map((color: string, i: number) => (
                            <GlassGradient
                                key={`treemap-glass-grad-${i}`}
                                id={`treemap-glass-grad-${stableId}-${i}`}
                                color={color}
                            />
                        ))}
                    </>
                )}
                {/* Fallback Gradients - Use direct JSX for better compatibility and intense visual depth */}
                {style?.finish !== 'glass' && useGradient && colors.map((color, i) => (
                    <linearGradient key={`tm-grad-${i}`} id={`treemap-grad-${stableId}-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="60%" stopColor={adjustBrightness(color, -20)} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={adjustBrightness(color, -40)} stopOpacity="0.9" />
                    </linearGradient>
                ))}
            </defs>

            {/* 1. Rectangles Rendering */}
            <g>
                {treemapPositions.map((pos: any, i: number) => {
                    const { x, y, width: rectW, height: rectH, color, originalIndex, isHero } = pos;
                    const fill = style?.finish === 'glass'
                        ? `url(#treemap-glass-grad-${stableId}-${originalIndex % colors.length})`
                        : (useGradient ? `url(#treemap-grad-${stableId}-${originalIndex % colors.length})` : color);

                    return (
                        <rect
                            key={`rect-${i}`}
                            x={x}
                            y={y}
                            width={rectW}
                            height={rectH}
                            fill={fill}
                            rx={isHero && isInfographic ? 16 : 8}
                            ry={isHero && isInfographic ? 16 : 8}
                            filter={style?.finish === 'glass' ? `url(#treemap-glass-filter-${stableId})` : undefined}
                            data-fallback-color={color}
                            stroke={isHero && isInfographic ? "white" : "rgba(255,255,255,0.4)"}
                            strokeWidth={isHero && isInfographic ? 5 : 1.5}
                            strokeOpacity={isHero && isInfographic ? 1 : 0.7}
                        // FIXED: Removed transition to prevent "White Screen" on export. 
                        // html-to-image captures the DOM state immediately; if scaling from 0, it captures 0.
                        // style={{ transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} 
                        />
                    );
                })}
            </g>

            {/* 2. Spider Legs Rendering */}
            <g>
                {treemapPositions.map((pos: any, i: number) => {
                    if (pos.strategy !== 'external' || !pos.spiderLeg) return null;
                    const { points } = pos.spiderLeg;

                    return (
                        <polyline
                            key={`leg-${i}`}
                            points={points.join(' ')}
                            fill="none"
                            stroke={CHART_THEME.colors.neutral.medium}
                            strokeWidth={1}
                            strokeDasharray="3,3"
                            opacity={0.4}
                        />
                    );
                })}
            </g>

            {/* 3. Labels & Annotations Rendering */}
            <g>
                {treemapPositions.map((pos: any, i: number) => {
                    if (pos.strategy === 'hidden') return null;

                    const { x, y, width: rectW, height: rectH, label, value, percent, isHero, strategy, spiderLeg, measure, originalIndex, color } = pos;
                    const isInternal = strategy === 'internal';

                    const targetX = isInternal ? x + rectW / 2 : spiderLeg.labelX;
                    const targetY = isInternal ? y + rectH / 2 : spiderLeg.labelY;
                    const itemHeight = 30; // Increased vertical space for better legibility
                    const textAnchor = isInternal ? 'middle' : spiderLeg.textAnchor;

                    // TYPOGRAPHY LOGIC
                    const typo = getTypographyForTreemap(isHero, isInfographic, isInternal);
                    const baseSize = getScaledFont(baseFontSize, baseFontUnit, isHero && isInfographic ? 'medium' : (isInternal ? 'small' : 'tiny'));

                    // The Engine now returns the correct fontSize in 'measure' if it clamped it, 
                    // but we'll use a safer scale here too.
                    const fontSize = baseSize * typo.sizeMultiplier;

                    const lines = measure?.wrappedLines || [label];
                    const rawColor = color || (colors[originalIndex % colors.length]);
                    const textColor = isInternal ? getContrastColor(rawColor) : CHART_THEME.colors.neutral.dark;

                    // Value formatted
                    const formattedValue = style?.numberFormat
                        ? smartFormatChartValue(value, style.numberFormat)
                        : value.toLocaleString();

                    const showPercent = isInfographic && (isHero || rectW > 80);

                    return (
                        <g key={`label-group-${i}`} style={{ transition: 'all 0.5s ease' }}>
                            {/* Hero Glow Backdrop */}
                            {isHero && isInfographic && isInternal && (
                                <rect
                                    x={x + 5} y={y + 5} width={rectW - 10} height={rectH - 10}
                                    fill="white" fillOpacity={0.15} rx={14} pointerEvents="none"
                                />
                            )}

                            <text
                                x={targetX}
                                y={targetY - (measure?.totalHeight ?? 0) / 2 + (fontSize * (isHero ? 0.3 : 0.8))}
                                textAnchor={textAnchor}
                                fontFamily={style?.fontFamily || 'Inter, sans-serif'}
                                fontSize={fontSize}
                                fill={textColor}
                                fontWeight={typo.fontWeight}
                                style={{ pointerEvents: 'none', letterSpacing: isHero ? '0.02em' : 'normal', transition: 'all 0.5s ease', fontFamily: style?.fontFamily || 'Inter, sans-serif' }}
                            >
                                <tspan x={targetX} dy="0" fontWeight={isHero ? 900 : 800}>{formattedValue}</tspan>
                                {lines.map((line: string, lineIdx: number) => (
                                    <tspan
                                        key={lineIdx}
                                        x={targetX}
                                        dy={fontSize * (isHero ? 0.35 : 1.1)}
                                        fontSize={fontSize * (isHero ? 0.22 : 0.7)}
                                        opacity={0.9}
                                        fontWeight={isHero ? 700 : 500}
                                        style={{ textTransform: typo.textTransform }}
                                    >
                                        {typo.textTransform === 'uppercase' || !isInternal ? line.toUpperCase() : line}
                                    </tspan>
                                ))}
                            </text>

                            {/* Percentage Badge */}
                            {showPercent && isInternal && (
                                <g transform={`translate(${isHero ? x + rectW - 20 : x + rectW - 12}, ${isHero ? y + 25 : y + 18})`}>
                                    <text
                                        textAnchor="end"
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, isHero ? 'small' : 'tiny')}
                                        fill={textColor}
                                        fillOpacity={0.7}
                                        fontWeight={800}
                                        fontFamily={fontFamily}
                                    >
                                        {percent.toFixed(0)}%
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
