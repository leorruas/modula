'use client';

import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient, getChartColor } from '@/utils/chartTheme';
import { smartFormatChartValue } from '@/utils/formatters';

interface GaugeChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function GaugeChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: GaugeChartProps) {
    const value = data.datasets[0]?.data[0] || 0;
    const target = data.datasets[0]?.data[1] || 100;
    const percentage = Math.min(100, Math.max(0, (value / target) * 100));

    const color = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const isInfographic = style?.mode === 'infographic';
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    const useGradient = style?.useGradient;

    // Standard positioning and sizes
    const centerX = width / 2;
    // Infographic mode might want more space at bottom for labels
    const centerY = height * (isInfographic ? 0.7 : 0.75);
    const radius = Math.min(width / 2.2, height / 1.5);
    const strokeWidth = isInfographic ? radius * 0.35 : radius * 0.25;

    // SVG arc calculations
    const startAngle = -Math.PI; // -180 degrees
    const endAngle = 0; // 0 degrees

    const polarToCartesian = (cx: number, cy: number, r: number, angleInRadians: number) => {
        return {
            x: cx + r * Math.cos(angleInRadians),
            y: cy + r * Math.sin(angleInRadians)
        };
    };

    const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
        const start = polarToCartesian(x, y, r, startA);
        const end = polarToCartesian(x, y, r, endA);
        const largeArcFlag = endA - startA <= Math.PI ? "0" : "1";
        return [
            "M", start.x, start.y,
            "A", r, r, 0, largeArcFlag, 1, end.x, end.y
        ].join(" ");
    };

    // Calculate current progress angle
    const currentAngle = startAngle + (percentage / 100) * (endAngle - startAngle);

    // Coordinate for the end of the progress arc (for marker)
    const progressEnd = polarToCartesian(centerX, centerY, radius, currentAngle);

    return (
        <BaseChart width={width} height={height} data={data} type="gauge">
            {/* Gradient Definition */}
            <defs>
                <linearGradient id={`gaugeGradient-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
                {/* Glass Definitions */}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient`, color) }} />
                    </>
                )}
            </defs>

            {/* Background Track */}
            <path
                d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
                fill="none"
                stroke={isInfographic ? CHART_THEME.colors.neutral.lighter : "#e5e7eb"}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={isInfographic ? 0.3 : 1}
            />

            {/* Progress Bar */}
            <path
                d={describeArc(centerX, centerY, radius, startAngle, currentAngle)}
                fill="none"
                stroke={style?.finish === 'glass' ? `url(#glassGradient)` : (useGradient ? `url(#gaugeGradient-${value})` : color)}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : (isInfographic ? "url(#chartShadow)" : undefined)}
                opacity={isInfographic ? 0.9 : 1}
            />

            {/* Marker/Needle Tip (Infographic Only) */}
            {isInfographic && (
                <circle
                    cx={progressEnd.x}
                    cy={progressEnd.y}
                    r={strokeWidth * 0.2}
                    fill="#fff"
                    stroke={color}
                    strokeWidth={2}
                />
            )}

            {/* Value Text (Big Percentage) */}
            <text
                x={centerX}
                y={centerY - radius * 0.15}
                textAnchor="middle"
                style={{
                    fontSize: isInfographic ? radius * 0.55 : radius * 0.4,
                    fontWeight: isInfographic ? CHART_THEME.fontWeights.black : 800,
                    fontFamily: valueFont,
                    fill: CHART_THEME.colors.neutral.dark,
                    letterSpacing: isInfographic ? '-0.02em' : '0'
                }}
            >
                {Math.round(percentage)}%
            </text>

            {/* Limit Labels (0 and Target) - Infographic Only */}
            {isInfographic && (
                <>
                    <text
                        x={centerX - radius - strokeWidth / 2}
                        y={centerY + 20}
                        textAnchor="middle"
                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                        fontFamily={fontFamily}
                        fontWeight={CHART_THEME.fontWeights.bold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        0
                    </text>
                    <text
                        x={centerX + radius + strokeWidth / 2}
                        y={centerY + 20}
                        textAnchor="middle"
                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                        fontFamily={fontFamily}
                        fontWeight={CHART_THEME.fontWeights.bold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {smartFormatChartValue(target, style?.numberFormat)}
                    </text>
                </>
            )}

            {/* Label Text (Category/Title) */}
            <text
                x={centerX}
                y={centerY + (isInfographic ? radius * 0.25 : radius * 0.2)}
                textAnchor="middle"
                style={{
                    fontSize: getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'small' : 'tiny'),
                    fontWeight: isInfographic ? CHART_THEME.fontWeights.bold : 500,
                    fontFamily,
                    fill: CHART_THEME.colors.neutral.medium,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}
            >
                {data.datasets[0]?.label || 'Progresso'}
            </text>

            {/* Absolute values (Current / Target) - Standard Mode */}
            {!isInfographic && (
                <text
                    x={centerX}
                    y={centerY + radius * 0.4}
                    textAnchor="middle"
                    style={{
                        fontSize: radius * 0.1,
                        fontFamily,
                        fill: '#9ca3af'
                    }}
                >
                    {smartFormatChartValue(value, style?.numberFormat)} de {smartFormatChartValue(target, style?.numberFormat)}
                </text>
            )}

            {/* Absolute values - Infographic Mode (Smaller, below label) */}
            {isInfographic && (
                <text
                    x={centerX}
                    y={centerY + radius * 0.38}
                    textAnchor="middle"
                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                    fontFamily={valueFont}
                    fill={color}
                    fontWeight={CHART_THEME.fontWeights.medium}
                >
                    {smartFormatChartValue(value, style?.numberFormat)} / {smartFormatChartValue(target, style?.numberFormat)}
                </text>
            )}
        </BaseChart>
    );
}
