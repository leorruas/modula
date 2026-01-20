import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createGlassGradient, createGlassBorderGradient } from '@/utils/chartTheme';

import { ensureDistinctColors } from '@/utils/colors';

interface BarChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function BarChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: BarChartProps) {
    if (!data.datasets || data.datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';

    // Calculate global max value across all datasets
    const allValues = data.datasets.flatMap(d => d.data || []);
    const maxValue = Math.max(...allValues, 1); // Avoid 0

    // Smart Margins & Dynamic Label Space
    const maxLabelLength = labels.reduce((max, label) => Math.max(max, label.length), 0);
    // Use baseFontSize for character width approximation (approx 0.45-0.5 height for proportional fonts)
    // const charWidth = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small') * 0.48; // Removed old charWidth

    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = fontSize * 0.48;
    const isStackedLayout = isInfographic || maxLabelLength > 15 || (maxLabelLength * charWidth > width * 0.25);

    // Cap label space to prevent squashing the chart (max 35% of width)
    const maxLabelSpaceCap = width * 0.35;
    const dynamicLabelSpace = Math.min(maxLabelSpaceCap, Math.max(isInfographic ? 120 : 60, maxLabelLength * charWidth));

    const padding = isInfographic ? CHART_THEME.padding.large : 0;

    const maxStackedLines = 3;
    const maxCharsPerLine = isStackedLayout ? Math.floor(width / charWidth) : 100;

    const wrapLabel = (text: string) => {
        if (!isStackedLayout) return [text];
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
        return lines.slice(0, maxStackedLines);
    };

    const wrappedLabels = labels.map(wrapLabel);
    const maxLinesUsed = isStackedLayout ? Math.max(...wrappedLabels.map(l => l.length), 1) : 1;

    const marginTop = isStackedLayout ? (isInfographic ? 40 : 10) : padding;
    const marginRight = isInfographic ? 80 : 40;
    const marginBottom = padding + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 20);
    const marginLeft = isStackedLayout ? 25 : (dynamicLabelSpace + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 20));

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    // Intelligent Weighted Grouping Logic
    const categoryCount = labels.length;
    const barsPerGroup = data.datasets.length;
    const interGroupGap = isStackedLayout ? 16 : 8; // Fixed gap between categories
    const labelBarGap = isStackedLayout ? 6 : 0;   // Gap between label and its bars
    const baseBarHeight = 14;
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
    const scaleFactor = totalNaturalHeight > chartHeight ? chartHeight / totalNaturalHeight : 1;
    const verticalOffset = totalNaturalHeight < chartHeight ? (chartHeight - totalNaturalHeight) / 2 : 0;

    // 3. Final positions and scaled dimensions
    const groupLayout: { y: number; height: number }[] = [];
    let currentY = verticalOffset;

    for (let i = 0; i < categoryCount; i++) {
        const h = categoryNaturalHeights[i] * scaleFactor;
        groupLayout.push({ y: currentY, height: h });
        currentY += h + (interGroupGap * scaleFactor);
    }

    const barHeight = baseBarHeight * scaleFactor;
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;

    // Color logic
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, barsPerGroup);

    // Legend Component
    const Legend = data.datasets.length > 1 ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {data.datasets.map((ds, i) => (ds.label && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: computedColors[i % computedColors.length] }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily }}>{ds.label}</span>
                </div>
            )))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="bar" legend={Legend}>
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
                {useGradient && computedColors.map((color, i) => (
                    <linearGradient key={`grad-${i}`} id={`barGradient-${i}`} x1="0" y1="0" x2="1" y2="0">
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
                {labels.map((label, i) => {
                    const { y, height: groupHeight } = groupLayout[i];
                    const labelLines = wrappedLabels[i].length;
                    const catLabelHeight = isStackedLayout ? ((labelLines * fontSize * 1.2) + 6) * scaleFactor : 0;

                    return (
                        <g key={i} transform={`translate(0, ${y})`}>
                            {/* Category Label */}
                            <text
                                x={isStackedLayout ? 0 : -16}
                                y={isStackedLayout ? fontSize * 0.8 * scaleFactor : (groupHeight - (barsPerGroup * barHeight)) / 2}
                                dy={isStackedLayout ? ".35em" : ".35em"}
                                textAnchor={isStackedLayout ? "start" : "end"}
                                fontSize={fontSize}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic || isStackedLayout ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                <title>{label}</title>
                                {isStackedLayout ? (
                                    wrappedLabels[i].map((line, lineIdx) => (
                                        <tspan
                                            key={lineIdx}
                                            x={0}
                                            dy={lineIdx === 0 ? 0 : fontSize * 1.2}
                                        >
                                            {line}
                                        </tspan>
                                    ))
                                ) : (
                                    label.length * charWidth > dynamicLabelSpace
                                        ? label.substring(0, Math.floor(dynamicLabelSpace / charWidth) - 3) + '...'
                                        : label
                                )}
                            </text>

                            {/* Grouped Bars */}
                            {data.datasets.map((dataset, dsIndex) => {
                                const value = dataset.data[i] || 0;
                                const barW = (value / maxValue) * chartWidth;
                                const barY = (isStackedLayout ? catLabelHeight : (groupHeight - (barsPerGroup * barHeight)) / 2) + dsIndex * barHeight;
                                const color = computedColors[dsIndex % computedColors.length];
                                const radius = barHeight / 2;

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
                                                    ? `url(#glassGradient-${dsIndex % computedColors.length})`
                                                    : useGradient
                                                        ? `url(#barGradient-${dsIndex % computedColors.length})`
                                                        : color
                                            }
                                            opacity={style?.finish === 'glass' ? 1 : 0.9}
                                            rx={radius}
                                            filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : "url(#barShadow)"}
                                        />

                                        {/* Value label */}
                                        <text
                                            x={barW + 8}
                                            y={barY + (barHeight - barInnerGap) / 2}
                                            dy=".35em"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? (barsPerGroup > 2 ? 'medium' : 'large') : 'small', isInfographic)}
                                            fontFamily={CHART_THEME.fonts.number}
                                            fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                            fill={CHART_THEME.colors.neutral.dark}
                                        >
                                            {value}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* Y-axis line */}
                <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />

                {/* Axis labels */}
                {data.xAxisLabel && (
                    <text
                        x={chartWidth / 2}
                        y={chartHeight + 25}
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.xAxisLabel}
                    </text>
                )}
                {data.yAxisLabel && (
                    <text
                        transform="rotate(-90)"
                        x={-chartHeight / 2}
                        y={-marginLeft + 15} // Position relative to new left margin
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.yAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
