import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { ensureDistinctColors } from '@/utils/colors';

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

    // Calculate global max value across all datasets
    const allValues = data.datasets.flatMap(d => d.data || []);
    const maxValue = Math.max(...allValues, 1); // Avoid 0

    const topMargin = isInfographic ? 0 : 20; // Extra room for value labels below legend
    const padding = isInfographic ? CHART_THEME.padding.large : 0;
    const chartWidth = width - (isInfographic ? padding * 2 : CHART_THEME.padding.small * 2);
    const chartHeight = height - (isInfographic ? padding * 2 : CHART_THEME.padding.small * 2) - topMargin;

    // Grouping Logic
    const categoryCount = labels.length;
    const groupWidth = chartWidth / Math.max(categoryCount, 1);
    const groupGap = groupWidth * 0.3; // Increased gap for premium look
    const barsPerGroup = data.datasets.length;
    const colWidth = (groupWidth - groupGap) / barsPerGroup;
    const colInnerGap = colWidth * 0.1;

    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = fontSize * 0.5;
    const maxLines = 3;
    const maxCharsPerLine = Math.floor((groupWidth - groupGap) / charWidth);

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
        return lines.slice(0, maxLines);
    };

    const wrappedLabels = labels.map(wrapLabel);
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.2) + 20;

    // Color logic
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, barsPerGroup);

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;

    // Legend Component
    const Legend = barsPerGroup > 1 ? (
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
        <BaseChart width={width} height={height} data={data} type="column" legend={Legend}>
            {/* ... defs ... */}
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
                    const y = (chartHeight - labelBottomPadding + 20) * fraction;
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
                    const effectiveChartHeight = chartHeight - labelBottomPadding + 20;

                    return (
                        <g key={i} transform={`translate(${groupX}, 0)`}>
                            {/* Wrapped Horizontal Labels */}
                            <text
                                x={(groupWidth - groupGap) / 2}
                                y={effectiveChartHeight + 20}
                                textAnchor="middle"
                                fontSize={fontSize}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                <title>{label}</title>
                                {wrappedLabels[i].map((line, lineIdx) => (
                                    <tspan
                                        key={lineIdx}
                                        x={(groupWidth - groupGap) / 2}
                                        dy={lineIdx === 0 ? 0 : fontSize * 1.2}
                                    >
                                        {line}
                                    </tspan>
                                ))}
                            </text>

                            {/* Grouped Columns */}
                            {data.datasets.map((dataset, dsIndex) => {
                                const value = dataset.data[i] || 0;
                                const barH = (value / maxValue) * (effectiveChartHeight);
                                const x = dsIndex * colWidth;
                                const y = effectiveChartHeight - barH;
                                const color = computedColors[dsIndex % computedColors.length];

                                return (
                                    <g key={dsIndex}>
                                        {/* Ghost Column / Background Track */}
                                        <rect
                                            x={x}
                                            y={0}
                                            width={colWidth - colInnerGap}
                                            height={effectiveChartHeight}
                                            fill="#f3f4f6"
                                            opacity={0.6}
                                            rx={(colWidth - colInnerGap) / 2}
                                        />

                                        {/* Data Column */}
                                        <rect
                                            x={x}
                                            y={y}
                                            width={colWidth - colInnerGap}
                                            height={barH}
                                            fill={
                                                style?.finish === 'glass'
                                                    ? `url(#glassGradient-${dsIndex % computedColors.length})`
                                                    : (useGradient ? `url(#colGradient-${dsIndex % computedColors.length})` : color)
                                            }
                                            opacity={style?.finish === 'glass' ? 1 : 0.9}
                                            rx={(colWidth - colInnerGap) / 2}
                                            filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : "url(#colShadow)"}
                                        />

                                        {/* Value label */}
                                        <text
                                            x={x + (colWidth - colInnerGap) / 2}
                                            y={y - (isInfographic ? (barsPerGroup > 2 ? 10 : 15) : 8)}
                                            textAnchor="middle"
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

                {/* X-axis line */}
                <line
                    x1={0}
                    y1={chartHeight - labelBottomPadding + 20}
                    x2={chartWidth}
                    y2={chartHeight - labelBottomPadding + 20}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
                {/* Y-Axis Label */}
                {data.yAxisLabel && (
                    <text
                        transform="rotate(-90)"
                        x={-chartHeight / 2}
                        y={-CHART_THEME.spacing.axisTitleCompact}
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
