import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createIOSGlassLineFilter, createGlassGradient } from '@/utils/chartTheme';

interface AreaChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function AreaChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: AreaChartProps) {
    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const values = dataset.data;
    const labels = data.labels || [];

    const isInfographic = style?.mode === 'infographic';
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalShowDeltaPercent = infographicConfig.showDeltaPercent || false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;

    // Smart Margins
    const basePadding = isInfographic ? 40 : 10;
    const marginTop = isInfographic ? 60 : 12;
    const marginRight = isInfographic ? 40 : CHART_THEME.padding.small;
    const marginLeft = isInfographic ? 60 : (isInfographic ? basePadding : CHART_THEME.padding.small) + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 25);

    const chartWidth = width - marginLeft - marginRight;
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');

    // Multi-line Label Wrapping Restore - Aggressive logic from Histogram
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor((chartWidth / Math.max(labels.length, 1)) / charWidth * 0.9) || 12;
    const wrapLabel = (text: string) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let cur = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            if ((cur + ' ' + words[i]).length <= maxCharsPerLine) {
                cur += ' ' + words[i];
            } else {
                lines.push(cur);
                cur = words[i];
            }
        }
        lines.push(cur);
        return lines.slice(0, 3);
    };
    const wrappedLabels = labels.map(wrapLabel);
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);

    // Gestalt Staggering: Robust logic form Histogram
    const pointDistance = chartWidth / (values.length - 1 || 1);
    // Increased threshold for staggering activation
    const shouldStagger = isInfographic && pointDistance < 100;
    // Dynamic offset based on neighbor text height
    const staggerOffset = shouldStagger ? (maxLinesNeeded * fontSize * 1.3 + 15) : 0;

    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.2) + staggerOffset + 30;

    const marginBottom = (isInfographic ? basePadding : CHART_THEME.padding.small) + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 0) + labelBottomPadding;
    const chartHeight = Math.max(height - marginTop - marginBottom, 10);
    const effectiveBaselineY = chartHeight;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    const useGradient = style?.useGradient;
    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);

    const points = values.map((val, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * chartWidth;
        const y = chartHeight - ((val / Math.max(maxValue, 1)) * chartHeight);
        return { x, y };
    });

    const areaPath = `M 0,${chartHeight} ` + points.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${chartWidth},${chartHeight} Z`;
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    const Legend = (finalLegendPosition !== 'none' && dataset.label) ? (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                    width: 12, height: 12, borderRadius: 3, background: primaryColor,
                    ...(style?.finish === 'glass' && {
                        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(0,0,0,0.1))',
                        border: '1px solid rgba(255,255,255,0.8)',
                    })
                }} />
                <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily }}>{dataset.label}</span>
            </div>
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="area" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {isInfographic && heroValueIndex !== undefined && (
                    <linearGradient id="heroStreamGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.1} />
                    </linearGradient>
                )}
                {useGradient && (
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity={isInfographic ? 0.6 : 0.9} />
                        <stop offset="70%" stopColor={primaryColor} stopOpacity={isInfographic ? 0.3 : 0.85} />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity={0.1} />
                    </linearGradient>
                )}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('glassAreaFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassLineFilter('glassLineFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('glassPointFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createGlassGradient('glassAreaGradient', primaryColor) }} />
                    </>
                )}
            </defs>

            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={i} x1={0} y1={chartHeight * f} x2={chartWidth} y2={chartHeight * f}
                        stroke={CHART_THEME.colors.neutral.lighter} strokeWidth={1} opacity={0.1} strokeDasharray={"4 4"} />
                ))}

                {isInfographic && values.map((v, i) => {
                    if (!dataset.metadata?.[i] && i !== heroValueIndex) return null;
                    const p = points[i];
                    return (
                        <line key={`ms-${i}`} x1={p.x} y1={p.y} x2={p.x} y2={chartHeight}
                            stroke={i === heroValueIndex ? primaryColor : CHART_THEME.colors.neutral.lighter}
                            strokeWidth={i === heroValueIndex ? 1 : 0.5}
                            strokeDasharray={i === heroValueIndex ? undefined : "4 4"}
                            opacity={i === heroValueIndex ? 0.4 : 0.2} />
                    );
                })}

                <path d={areaPath}
                    fill={style?.finish === 'glass' ? "url(#glassAreaGradient)" : (useGradient ? "url(#areaGradient)" : primaryColor)}
                    fillOpacity={style?.finish === 'glass' ? 1 : (useGradient ? 1 : (isInfographic ? 0.2 : 0.3))}
                    filter={style?.finish === 'glass' ? "url(#glassAreaFilter)" : undefined} />

                {isInfographic && heroValueIndex !== undefined && (
                    <circle cx={points[heroValueIndex].x} cy={points[heroValueIndex].y} r={30} fill={primaryColor} opacity={0.1} />
                )}

                <path d={linePath} fill="none" stroke={primaryColor} strokeWidth={isInfographic ? 4 : 2}
                    strokeLinecap="round" strokeLinejoin="round"
                    filter={style?.finish === 'glass' ? "url(#glassLineFilter)" : (isInfographic ? undefined : "url(#chartShadow)")}
                    strokeOpacity={style?.finish === 'glass' ? 0.8 : 1} />

                {points.map((p, i) => {
                    const ratio = values[i] / Math.max(maxValue, 1);
                    const isManualHero = heroValueIndex === i;

                    const shouldShowLabelBody = finalShowAllLabels || !isInfographic || ratio >= 0.5 || isManualHero || !!dataset.metadata?.[i];

                    const typo = (() => {
                        if (!isInfographic) return { fw: CHART_THEME.fontWeights.semibold, sm: 1, op: 1 };
                        if (ratio >= 0.8) return { fw: CHART_THEME.fontWeights.black, sm: 1.8, op: 1 };
                        if (ratio >= 0.5) return { fw: CHART_THEME.fontWeights.semibold, sm: 1.3, op: 0.8 };
                        return { fw: CHART_THEME.fontWeights.normal, sm: 1.0, op: 0.6 };
                    })();
                    const fsm = isManualHero ? typo.sm * 1.3 : typo.sm;

                    const isStaggered = shouldStagger && (i % 2 !== 0);
                    const currentYOffset = isStaggered ? staggerOffset : 0;

                    const showMarker = !shouldShowLabelBody && isInfographic;

                    if (showMarker) {
                        return <circle key={i} cx={p.x} cy={p.y} r={2} fill={primaryColor} opacity={0.2} />;
                    }

                    return (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r={isInfographic ? (isManualHero ? 7 : (ratio >= 0.8 ? 5 : 3)) : 3}
                                fill={isManualHero && isInfographic ? "#fff" : primaryColor}
                                stroke={isManualHero && isInfographic ? primaryColor : "#fff"}
                                strokeWidth={2} filter={style?.finish === 'glass' ? "url(#glassPointFilter)" : undefined} />

                            {isInfographic && (
                                <g>
                                    {(() => {
                                        let bt = ""; let bc = CHART_THEME.colors.neutral.medium; let sb = false;
                                        if (finalShowValueAnnotations && isManualHero) {
                                            bt = finalAnnotationLabels?.[i] !== undefined ? finalAnnotationLabels[i] : "DESTAQUE";
                                            sb = bt !== "";
                                        }
                                        else if (finalUseMetadata && dataset.metadata?.[i]) { bt = dataset.metadata[i]; bc = primaryColor; sb = true; }
                                        else if (finalShowExtremes && !isManualHero) {
                                            if (values[i] === maxValue) { bt = "🏆 PICO"; bc = '#d97706'; sb = true; }
                                            else if (values[i] === minValue) { bt = "🔻 MÍNIMO"; bc = '#ef4444'; sb = true; }
                                        }
                                        if (!sb) return null;
                                        return (
                                            <text x={p.x} y={p.y - (25 * fsm)} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                                fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} letterSpacing="0.1em" fill={bc}>
                                                {bt.toUpperCase()}
                                            </text>
                                        );
                                    })()}

                                    <text x={p.x} y={p.y - (10 * fsm)} textAnchor="middle" fill={CHART_THEME.colors.neutral.dark} opacity={isManualHero ? 1 : typo.op}
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'huge', true) * fsm * 0.55} fontFamily={valueFont} fontWeight={typo.fw}>
                                        {values[i]}
                                        {finalShowDeltaPercent && (
                                            <tspan dx={4} fontSize="0.5em" fill={values[i] >= values[0] ? '#10b981' : '#ef4444'}>
                                                {values[i] >= values[0] ? '↑' : '↓'}{Math.abs(((values[i] - values[0]) / (values[0] || 1)) * 100).toFixed(0)}%
                                            </tspan>
                                        )}
                                    </text>
                                </g>
                            )}

                            {!isInfographic && (
                                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                    fontFamily={CHART_THEME.fonts.number} fontWeight={CHART_THEME.fontWeights.semibold} fill={CHART_THEME.colors.neutral.dark}>
                                    {values[i]}
                                </text>
                            )}

                            {/* Axis Label */}
                            <g>
                                {(isStaggered && isInfographic) && (
                                    <line x1={p.x} y1={effectiveBaselineY} x2={p.x} y2={effectiveBaselineY + currentYOffset - 5}
                                        stroke={CHART_THEME.colors.neutral.medium} strokeWidth={1} opacity={0.2} />
                                )}
                                <text x={p.x} y={effectiveBaselineY + 20 + currentYOffset} textAnchor="middle" fontSize={fontSize} fontFamily={fontFamily} fill={CHART_THEME.colors.neutral.dark}
                                    fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium} opacity={isInfographic && !isManualHero ? 0.6 : 1}
                                    style={{ textTransform: isInfographic ? 'uppercase' : 'none', letterSpacing: isInfographic ? '0.05em' : '0' }}>
                                    <title>{labels[i]}</title>
                                    {wrappedLabels[i].map((line, idx) => (
                                        <tspan key={idx} x={p.x} dy={idx === 0 ? 0 : fontSize * 1.2}>{line}</tspan>
                                    ))}
                                </text>
                            </g>
                        </g>
                    );
                })}

                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.05 : CHART_THEME.effects.axisOpacity} />
            </g>
        </BaseChart>
    );
}
