import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont } from '@/utils/chartTheme';

interface RadarChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function RadarChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: RadarChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';
    const maxValue = Math.max(...values);
    const centerX = width / 2;
    const centerY = height / 2;
    // Optimize space: Use specific safe margins instead of generic theme padding
    // Classic: Needs space for labels (radius + 20) + text width (~15px)
    // Infographic: Needs space for values on top (y - 12) + huge font (~40px)
    const safeMargin = isInfographic ? 60 : 35;
    const radius = Math.min(width, height) / 2 - safeMargin;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;

    const angleStep = (2 * Math.PI) / values.length;

    return (
        <BaseChart width={width} height={height} data={data} type="radar">
            <defs>
                {useGradient && (
                    <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.15" />
                    </radialGradient>
                )}
            </defs>
            <g transform={`translate(${centerX}, ${centerY})`}>
                {/* Grid circles - only classic */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => (
                    <circle
                        key={i}
                        cx={0}
                        cy={0}
                        r={radius * fraction}
                        fill="none"
                        stroke={CHART_THEME.colors.neutral.lighter}
                        strokeWidth={1}
                        opacity={0.15}
                    />
                ))}

                {/* Axes */}
                {values.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    return (
                        <line
                            key={i}
                            x1={0}
                            y1={0}
                            x2={x}
                            y2={y}
                            stroke={CHART_THEME.colors.neutral.medium}
                            strokeWidth={1}
                            opacity={isInfographic ? 0.1 : 0.3}
                        />
                    );
                })}

                {/* Data polygon */}
                <polygon
                    points={values.map((value, i) => {
                        const angle = i * angleStep - Math.PI / 2;
                        const r = (value / maxValue) * radius;
                        const x = r * Math.cos(angle);
                        const y = r * Math.sin(angle);
                        return `${x},${y}`;
                    }).join(' ')}
                    fill={useGradient ? "url(#radarGradient)" : primaryColor}
                    fillOpacity={useGradient ? 1 : 0.3}
                    stroke={primaryColor}
                    strokeWidth={isInfographic ? 3 : 2}
                />

                {/* Data points and labels */}
                {values.map((value, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const r = (value / maxValue) * radius;
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);
                    const labelX = (radius + 20) * Math.cos(angle);
                    const labelY = (radius + 20) * Math.sin(angle);

                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={y}
                                r={isInfographic ? 6 : 4}
                                fill={primaryColor}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                            {isInfographic && (
                                <text
                                    x={x}
                                    y={y - 12}
                                    textAnchor="middle"
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge')}
                                    fontFamily={CHART_THEME.fonts.number}
                                    fontWeight={CHART_THEME.fontWeights.black}
                                    fill={CHART_THEME.colors.neutral.dark}
                                >
                                    {value}
                                </text>
                            )}
                            <text
                                x={labelX}
                                y={labelY}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small')}
                                fontFamily={CHART_THEME.fonts.label}
                                fill={CHART_THEME.colors.neutral.dark}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.normal}
                            >
                                {labels[i]}
                            </text>
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
