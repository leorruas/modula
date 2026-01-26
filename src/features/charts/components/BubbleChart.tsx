import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont } from '@/utils/chartTheme';
import { smartFormatChartValue } from '@/utils/formatters';

interface BubbleChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function BubbleChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: BubbleChartProps) {
    const datasets = data.datasets || [];
    if (datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    const labels = data.labels || [];
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;

    const isInfographic = style?.mode === 'infographic';
    const allValues = datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues, 1);

    const padding = isInfographic ? 65 : 30;
    const chartWidth = width - (padding * 2);
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'small' : 'tiny');

    // Label Wrapping
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

    const maxLinesNeeded = 2.5; // Estimated
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.5) + 30;
    const chartHeight = height - (padding * 1.5) - labelBottomPadding;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    const useGradient = style?.useGradient;
    const palette = style?.colorPalette || datasets.map((_, i) => getChartColor(i));

    // Legend Component
    const Legend = finalLegendPosition !== 'none' && datasets.length > 0 ? (
        <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '6px 12px',
            background: isInfographic ? 'rgba(0,0,0,0.02)' : 'transparent', borderRadius: 6
        }}>
            {datasets.map((ds, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <circle style={{ width: 8, height: 8, borderRadius: '50%', background: palette[i % palette.length] }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'tiny'), color: '#666', fontFamily, fontWeight: CHART_THEME.fontWeights.semibold }}>
                        {ds.label || `Série ${i + 1}`}
                    </span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="bubble" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {useGradient && palette.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`bubbleGradient-${i}`} cx="35%" cy="35%" r="65%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </radialGradient>
                ))}
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={`grid-${i}`} x1={0} y1={chartHeight * f} x2={chartWidth} y2={chartHeight * f}
                        stroke={CHART_THEME.colors.neutral.lighter} strokeWidth={1} opacity={0.1} strokeDasharray={"4 4"} />
                ))}

                {/* Hero Crosshairs (using first dataset for focus) */}
                {isInfographic && heroValueIndex !== undefined && (
                    <g opacity={0.15}>
                        {(() => {
                            const i = heroValueIndex;
                            const x = (i / Math.max(labels.length - 1, 1)) * chartWidth;
                            const y = chartHeight - ((datasets[0].data[i] / Math.max(maxValue, 1)) * chartHeight);
                            return (
                                <>
                                    <line x1={x} y1={y} x2={0} y2={y} stroke={palette[0]} strokeWidth={1} strokeDasharray={"2 2"} />
                                    <line x1={x} y1={y} x2={x} y2={chartHeight} stroke={palette[0]} strokeWidth={1} strokeDasharray={"2 2"} />
                                </>
                            );
                        })()}
                    </g>
                )}

                {/* Bubbles - Multi-Series */}
                {datasets.map((ds, dsIdx) => (
                    <g key={`ds-${dsIdx}`}>
                        {ds.data.map((v, i) => {
                            const x = (i / Math.max(labels.length - 1, 1)) * chartWidth;
                            const y = chartHeight - ((v / Math.max(maxValue, 1)) * chartHeight);
                            const ratio = v / Math.max(maxValue, 1);
                            const isManualHero = heroValueIndex === i && dsIdx === 0;
                            const bubbleColor = palette[dsIdx % palette.length];

                            const baseRadius = isInfographic ? (v / maxValue) * 45 + 12 : (v / maxValue) * 25 + 5;
                            const radius = isManualHero ? baseRadius * 1.15 : baseRadius;

                            const shouldShowLabel = finalShowAllLabels || !isInfographic || (dsIdx === 0 && (ratio >= 0.6 || isManualHero || !!ds.metadata?.[i]));

                            return (
                                <g key={i}>
                                    {isInfographic && isManualHero && (
                                        <circle cx={x} cy={y} r={radius + 12} fill={bubbleColor} opacity={0.08}>
                                            <animate attributeName="r" values={`${radius + 6};${radius + 18};${radius + 6}`} dur="4s" repeatCount="indefinite" />
                                        </circle>
                                    )}

                                    <circle cx={x} cy={y} r={radius}
                                        fill={useGradient ? `url(#bubbleGradient-${dsIdx % palette.length})` : bubbleColor}
                                        opacity={isInfographic ? (dsIdx === 0 ? (isManualHero ? 0.9 : 0.7) : 0.45) : 0.5}
                                        stroke={bubbleColor} strokeWidth={isManualHero ? 2.5 : 1} />

                                    {shouldShowLabel && (
                                        <g>
                                            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'tiny', isInfographic) * (isManualHero ? 1.1 : 0.9)}
                                                fontFamily={valueFont} fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                                fill={isInfographic ? "#fff" : CHART_THEME.colors.neutral.dark}
                                                style={{ textShadow: isInfographic ? '0 1px 3px rgba(0,0,0,0.2)' : 'none' }}>
                                                {smartFormatChartValue(v, style?.numberFormat)}
                                            </text>

                                            {isInfographic && dsIdx === 0 && labels[i] && (
                                                <g transform={`translate(${x}, ${chartHeight + 30})`}>
                                                    {wrapLabel(labels[i]).map((line, idx) => (
                                                        <text key={idx} x={0} y={idx * 12} textAnchor="middle"
                                                            fontSize={fontSize} fontFamily={fontFamily}
                                                            fontWeight={isManualHero ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium}
                                                            fill={CHART_THEME.colors.neutral.dark}
                                                            opacity={!isManualHero && ratio < 0.6 ? 0.6 : 1}
                                                            style={{ textTransform: 'uppercase' }}>
                                                            {line}
                                                        </text>
                                                    ))}
                                                </g>
                                            )}
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                ))}

                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.1 : 0.2} />
                <line x1={0} y1={0} x2={0} y2={chartHeight} stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.1 : 0.2} />
            </g>
        </BaseChart>
    );
}
