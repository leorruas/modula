import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient, getChartColor } from '@/utils/chartTheme';
import { generateMonochromaticPalette, ensureDistinctColors } from '@/utils/colors';

interface DonutChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function DonutChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: DonutChartProps) {
    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const values = dataset.data;
    const labels = data.labels || [];

    const isInfographic = style?.mode === 'infographic';
    const total = values.reduce((a, b) => a + b, 0);

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';

    const padding = isInfographic ? 100 : 20;
    const outerRadius = (Math.min(width, height) / 2) - padding;
    const innerRadius = outerRadius * (isInfographic ? 0.75 : 0.6);
    const centerX = width / 2;
    const centerY = height / 2;

    const useGradient = style?.useGradient;
    const initialColors = style?.colorPalette || ['#333', '#666', '#999', '#aaa'];

    let colors = initialColors;
    if (values.length > colors.length) {
        if (colors.length === 1) {
            colors = generateMonochromaticPalette(colors[0], values.length);
        } else {
            colors = ensureDistinctColors(colors, values.length);
        }
    }

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    let startAngle = 0;

    // Wrapping logic for external labels
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

    // Refined Legend Component with Grid and Wrapping (Consistency with PieChart)
    const Legend = finalLegendPosition !== 'none' && values.length > 0 ? (
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
        <BaseChart width={width} height={height} data={data} type="donut" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {useGradient && colors.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`donutGradient-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </radialGradient>
                ))}
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
                {/* Center Hero Narrative */}
                {isInfographic && (
                    <g>
                        {heroValueIndex !== undefined ? (
                            <>
                                <text y={-innerRadius * 0.4} textAnchor="middle" dominantBaseline="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                    fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.1em">
                                    {labels[heroValueIndex]?.toUpperCase() || "HERO"}
                                </text>
                                <text y={5} textAnchor="middle" dominantBaseline="middle" fontSize={innerRadius * 0.5}
                                    fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                    {((values[heroValueIndex] / total) * 100).toFixed(0)}%
                                </text>
                                <text y={innerRadius * 0.4} textAnchor="middle" dominantBaseline="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                    fontFamily={valueFont} fill={CHART_THEME.colors.neutral.medium}>
                                    {values[heroValueIndex]}
                                </text>
                            </>
                        ) : (
                            <>
                                <text y={-innerRadius * 0.35} textAnchor="middle" dominantBaseline="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                    fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.1em">
                                    TOTAL
                                </text>
                                <text y={10} textAnchor="middle" dominantBaseline="middle" fontSize={innerRadius * 0.6}
                                    fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                    {total}
                                </text>
                            </>
                        )}
                    </g>
                )}

                {values.map((value, i) => {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;
                    const isManualHero = heroValueIndex === i;

                    // Explosion Effect
                    const explosionOffset = (isInfographic && isManualHero) ? 15 : 0;
                    const explosionAngle = startAngle + sliceAngle / 2 - Math.PI / 2;
                    const ex = explosionOffset * Math.cos(explosionAngle);
                    const ey = explosionOffset * Math.sin(explosionAngle);

                    const x1 = outerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = outerRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = outerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = outerRadius * Math.sin(endAngle - Math.PI / 2);

                    const x3 = innerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y3 = innerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x4 = innerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y4 = innerRadius * Math.sin(startAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                    const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        `Z`
                    ].join(' ');

                    const percentage = ((value / total) * 100).toFixed(1);
                    const labelAngle = startAngle + sliceAngle / 2;

                    // Dynamic offset for external labels based on position
                    const labelR = isInfographic ? outerRadius + 55 : (outerRadius + innerRadius) / 2;
                    const lx = labelR * Math.cos(labelAngle - Math.PI / 2) + ex;
                    const ly = labelR * Math.sin(labelAngle - Math.PI / 2) + ey;

                    const currentStartAngle = startAngle;
                    startAngle += sliceAngle;

                    const shouldShowLabel = finalShowAllLabels || !isInfographic || (value / total >= 0.05) || isManualHero;
                    const wrappedLabelLines = isInfographic ? wrapLabel(labels[i]) : [labels[i]];

                    return (
                        <g key={i} transform={`translate(${ex}, ${ey})`}>
                            <path
                                d={pathData}
                                fill={
                                    style?.finish === 'glass'
                                        ? `url(#glassGradient-${i % colors.length})`
                                        : (useGradient ? `url(#donutGradient-${i % colors.length})` : colors[i % colors.length])
                                }
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : "url(#chartShadow)"}
                                stroke={style?.finish === 'glass' ? "none" : "#fff"}
                                strokeWidth={isInfographic ? (isManualHero ? 2 : 0.5) : 1}
                                strokeLinejoin="round"
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.7 : 1}
                            />

                            {shouldShowLabel && (
                                <g transform={`translate(${-ex}, ${-ey})`}>
                                    {isInfographic ? (
                                        <g transform={`translate(${lx}, ${ly})`}>
                                            {/* Badge for Extremes or Metadata */}
                                            {(() => {
                                                let bt = ""; let bc = CHART_THEME.colors.neutral.medium; let sb = false;
                                                if (finalShowValueAnnotations && isManualHero) {
                                                    bt = finalAnnotationLabels?.[i] !== undefined ? finalAnnotationLabels[i] : "DESTAQUE";
                                                    sb = bt !== "";
                                                }
                                                else if (finalUseMetadata && dataset.metadata?.[i]) { bt = dataset.metadata[i]; bc = colors[i % colors.length]; sb = true; }
                                                else if (finalShowExtremes && !isManualHero) {
                                                    const maxV = Math.max(...values);
                                                    const minV = Math.min(...values);
                                                    if (value === maxV) { bt = "🏆 PICO"; bc = '#d97706'; sb = true; }
                                                    else if (value === minV) { bt = "🔻 MÍNIMO"; bc = '#ef4444'; sb = true; }
                                                }
                                                if (!sb) return null;
                                                return (
                                                    <text y={-32} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                        fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} letterSpacing="0.05em" fill={bc}>
                                                        {bt.toUpperCase()}
                                                    </text>
                                                );
                                            })()}

                                            <text
                                                y={-5}
                                                textAnchor="middle"
                                                fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true) * (isManualHero ? 1.2 : 0.9)}
                                                fontFamily={valueFont}
                                                fontWeight={CHART_THEME.fontWeights.black}
                                                fill={CHART_THEME.colors.neutral.dark}
                                            >
                                                {percentage}%
                                            </text>

                                            {wrappedLabelLines.map((line, idx) => (
                                                <text
                                                    key={idx}
                                                    x={0}
                                                    y={12 + (idx * 12)}
                                                    textAnchor="middle"
                                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                    fontFamily={fontFamily}
                                                    fontWeight={isManualHero ? CHART_THEME.fontWeights.bold : CHART_THEME.fontWeights.medium}
                                                    fill={CHART_THEME.colors.neutral.medium}
                                                    style={{ textTransform: 'uppercase' }}
                                                >
                                                    {line}
                                                </text>
                                            ))}
                                        </g>
                                    ) : (
                                        <text
                                            x={lx}
                                            y={ly}
                                            textAnchor="middle"
                                            alignmentBaseline="middle"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                            fontFamily={fontFamily}
                                            fill="#fff"
                                            fontWeight={CHART_THEME.fontWeights.semibold}
                                        >
                                            {`${percentage}%`}
                                        </text>
                                    )}
                                </g>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
