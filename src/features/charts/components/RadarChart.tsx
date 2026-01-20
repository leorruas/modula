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
    const datasets = data.datasets || [];
    if (datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    const labels = data.labels || [];
    const numPoints = labels.length || 1;

    // Determine max value across all datasets for consistent scaling
    const allValues = datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues, 1);

    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalShowDeltaPercent = infographicConfig.showDeltaPercent || false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;

    const isInfographic = style?.mode === 'infographic';
    const centerX = width / 2;
    const centerY = height / 2;
    const safeMargin = isInfographic ? 85 : 45;
    const radius = Math.min(width, height) / 2 - safeMargin;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    const useGradient = style?.useGradient;
    const palette = style?.colorPalette || datasets.map((_, i) => getChartColor(i));

    const angleStep = (2 * Math.PI) / numPoints;

    // Wrapping logic for radial labels
    const wrapLabel = (text: string, maxChars: number = 12) => {
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

    // Legend Component
    const Legend = finalLegendPosition !== 'none' && datasets.length > 0 ? (
        <div style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '8px 12px',
            background: isInfographic ? 'rgba(0,0,0,0.03)' : 'transparent',
            borderRadius: 8
        }}>
            {datasets.map((ds, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 10, height: 10, borderRadius: 2, background: palette[i % palette.length],
                        ...(style?.finish === 'glass' && {
                            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(0,0,0,0.1))',
                            border: '1px solid rgba(255,255,255,0.8)',
                        })
                    }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'tiny'), color: '#555', fontFamily, fontWeight: CHART_THEME.fontWeights.semibold }}>
                        {ds.label || `Série ${i + 1}`}
                    </span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="radar" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {useGradient && datasets.map((_, i) => (
                    <radialGradient key={`grad-${i}`} id={`radarGradient-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={palette[i % palette.length]} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={palette[i % palette.length]} stopOpacity="0.1" />
                    </radialGradient>
                ))}
            </defs>
            <g transform={`translate(${centerX}, ${centerY})`}>
                {/* Grid circles */}
                {[0.25, 0.5, 0.75, 1].map((fraction, i) => (
                    <circle
                        key={i} cx={0} cy={0} r={radius * fraction}
                        fill="none" stroke={CHART_THEME.colors.neutral.lighter}
                        strokeWidth={1} opacity={isInfographic ? 0.1 : 0.2}
                    />
                ))}

                {/* Axes */}
                {labels.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    const isManualHero = heroValueIndex === i;

                    return (
                        <line
                            key={i} x1={0} y1={0} x2={x} y2={y}
                            stroke={isManualHero && isInfographic ? palette[0] : CHART_THEME.colors.neutral.medium}
                            strokeWidth={isManualHero && isInfographic ? 1.5 : 0.5}
                            opacity={isInfographic ? (isManualHero ? 0.3 : 0.05) : 0.2}
                        />
                    );
                })}

                {/* Data polygons for Multi-Series */}
                {datasets.map((ds, dsIdx) => (
                    <polygon
                        key={`poly-${dsIdx}`}
                        points={ds.data.map((value, i) => {
                            const angle = i * angleStep - Math.PI / 2;
                            const r = (value / maxValue) * radius;
                            const x = r * Math.cos(angle);
                            const y = r * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill={useGradient ? `url(#radarGradient-${dsIdx % palette.length})` : palette[dsIdx % palette.length]}
                        fillOpacity={useGradient ? 1 : (isInfographic ? 0.2 : 0.3)}
                        stroke={palette[dsIdx % palette.length]}
                        strokeWidth={isInfographic ? (dsIdx === 0 ? 4 : 2) : 2}
                        strokeLinejoin="round"
                    />
                ))}

                {/* Data points and labels (primarily from first dataset for focus) */}
                {labels.map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const value = datasets[0].data[i] || 0;
                    const r = (value / maxValue) * radius;
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);

                    // Wrapped labels position
                    const labelR = radius + (isInfographic ? 25 : 15);
                    const lx = labelR * Math.cos(angle);
                    const ly = labelR * Math.sin(angle);

                    const isManualHero = heroValueIndex === i;
                    const ratio = value / maxValue;

                    return (
                        <g key={i}>
                            {/* Hero Halo */}
                            {isInfographic && isManualHero && (
                                <circle cx={x} cy={y} r={12} fill={palette[0]} opacity={0.15} />
                            )}

                            {/* Points for all series (small) */}
                            {datasets.map((ds, dsIdx) => {
                                const dr = (ds.data[i] / maxValue) * radius;
                                const dx = dr * Math.cos(angle);
                                const dy = dr * Math.sin(angle);
                                return (
                                    <circle
                                        key={`dot-${dsIdx}-${i}`}
                                        cx={dx} cy={dy}
                                        r={isInfographic ? (dsIdx === 0 && isManualHero ? 6 : 3) : 3}
                                        fill={dsIdx === 0 && isManualHero && isInfographic ? "#fff" : palette[dsIdx % palette.length]}
                                        stroke={dsIdx === 0 && isManualHero && isInfographic ? palette[0] : "#fff"}
                                        strokeWidth={isInfographic ? 2 : 1.5}
                                        opacity={dsIdx === 0 ? 1 : 0.6}
                                    />
                                );
                            })}

                            {(finalShowAllLabels || !isInfographic || ratio >= 0.7 || isManualHero || (finalUseMetadata && datasets[0].metadata?.[i])) && (
                                <g>
                                    {isInfographic && (
                                        <g>
                                            {/* Editorial Badge */}
                                            {(() => {
                                                let bt = "";
                                                let bc = CHART_THEME.colors.neutral.medium;
                                                let sb = false;

                                                if (finalShowValueAnnotations && isManualHero) {
                                                    bt = finalAnnotationLabels?.[i] !== undefined ? finalAnnotationLabels[i] : "DESTAQUE";
                                                    sb = bt !== "";
                                                } else if (finalUseMetadata && datasets[0].metadata?.[i]) {
                                                    bt = datasets[0].metadata[i];
                                                    bc = palette[0];
                                                    sb = true;
                                                }
                                                if (!sb) return null;

                                                return (
                                                    <text
                                                        x={x} y={y - 20}
                                                        textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                        fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black}
                                                        letterSpacing="0.05em" fill={bc}
                                                    >
                                                        {bt.toUpperCase()}
                                                    </text>
                                                );
                                            })()}

                                            {/* Value Label */}
                                            <text
                                                x={x} y={y - 8} textAnchor="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, 'medium', true) * (isManualHero ? 1.2 : 0.9)}
                                                fontFamily={valueFont} fontWeight={isManualHero ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.bold}
                                                fill={CHART_THEME.colors.neutral.dark}
                                            >
                                                {value}
                                            </text>
                                        </g>
                                    )}

                                    {/* Category Label with Wrapping */}
                                    <g transform={`translate(${lx}, ${ly})`}>
                                        {wrapLabel(labels[i]).map((line, lineIdx, lines) => (
                                            <text
                                                key={lineIdx}
                                                x={0}
                                                y={(lineIdx - (lines.length - 1) / 2) * 12}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'tiny' : 'small')}
                                                fontFamily={fontFamily}
                                                fill={CHART_THEME.colors.neutral.dark}
                                                fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium}
                                                opacity={isInfographic ? (isManualHero ? 1 : 0.7) : 1}
                                                style={{ textTransform: isInfographic ? 'uppercase' : 'none' }}
                                            >
                                                {line}
                                            </text>
                                        ))}
                                    </g>
                                </g>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
