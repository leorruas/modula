'use client';

import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont } from '@/utils/chartTheme';

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

    const color = style?.colorPalette?.[0] || '#3b82f6';
    const fontFamily = style?.fontFamily || 'sans-serif';
    const useGradient = style?.useGradient;
    const isInfographic = style?.mode === 'infographic';

    // Standard positioning and sizes
    const centerX = width / 2;
    const centerY = height * 0.75; // Positioned lower for semi-circle
    const radius = Math.min(width / 2.5, height / 1.5);
    const strokeWidth = isInfographic ? radius * 0.4 : radius * 0.25;

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

    return (
        <BaseChart width={width} height={height} data={data} type="gauge">
            {/* Background Track */}
            <path
                d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />

            {/* Gradient Definition */}
            <defs>
                <linearGradient id={`gaugeGradient-${value}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
            </defs>

            {/* Progress Bar */}
            <path
                d={describeArc(centerX, centerY, radius, startAngle, currentAngle)}
                fill="none"
                stroke={useGradient ? `url(#gaugeGradient-${value})` : color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                filter="url(#chartShadow)"
            />

            {/* Value Text */}
            <text
                x={centerX}
                y={centerY - radius * 0.1}
                textAnchor="middle"
                style={{
                    fontSize: isInfographic ? radius * 0.6 : radius * 0.4,
                    fontWeight: 800,
                    fontFamily,
                    fill: '#111827'
                }}
            >
                {Math.round(percentage)}%
            </text>

            {/* Label Text */}
            <text
                x={centerX}
                y={centerY + radius * 0.2}
                textAnchor="middle"
                style={{
                    fontSize: isInfographic ? radius * 0.15 : radius * 0.12,
                    fontWeight: isInfographic ? 700 : 500,
                    fontFamily,
                    fill: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}
            >
                {data.datasets[0]?.label || 'Progresso'}
            </text>

            {/* Absolute values (Current / Target) */}
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
                    {value} de {target}
                </text>
            )}
        </BaseChart>
    );
}
