import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createIOSGlassLineFilter, createGlassGradient } from '@/utils/chartTheme';

interface MixedChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function MixedChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: MixedChartProps) {
    const datasetBars = data.datasets?.[0];
    const datasetLine = data.datasets?.length > 1 ? data.datasets[1] : null;

    if (!datasetBars || !datasetBars.data || datasetBars.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    const labels = data.labels || [];
    const valuesBar = datasetBars.data;
    const valuesLine = datasetLine ? datasetLine.data : [];

    const allValues = [...valuesBar, ...valuesLine];
    const maxValue = Math.max(...allValues, 1);

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalAnnotationLabels = infographicConfig.annotationLabels;
    const finalShowExtremes = infographicConfig.showExtremes || false;
    const finalUseMetadata = infographicConfig.useMetadata || false;
    const finalShowAllLabels = infographicConfig.showAllLabels || false;

    const padding = isInfographic ? 60 : 20;
    const marginLeft = isInfographic ? 60 : (CHART_THEME.padding.small + 30);
    const marginRight = isInfographic ? 40 : CHART_THEME.padding.small;
    const marginTop = isInfographic ? 60 : 20;

    const chartWidth = width - marginLeft - marginRight;
    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');

    // Wrapping
    const charWidth = fontSize * 0.5;
    const maxCharsPerLine = Math.floor((chartWidth / Math.max(labels.length, 1)) / charWidth) || 12;
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
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.2) + 20;

    const chartHeight = height - marginTop - (isInfographic ? padding : 20) - labelBottomPadding;
    const effectiveBaselineY = chartHeight;
    const barWidth = (chartWidth / valuesBar.length) * 0.7;

    const color1 = style?.colorPalette?.[0] || getChartColor(0);
    const color2 = style?.colorPalette?.[1] || getChartColor(1);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;

    const slotWidth = chartWidth / valuesBar.length;

    const linePoints = valuesLine.map((value, i) => {
        const cx = i * slotWidth + slotWidth / 2;
        const cy = chartHeight - ((value / maxValue) * chartHeight);
        return { x: cx, y: cy };
    });

    const polylinePoints = linePoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <BaseChart width={width} height={height} data={data} type="mixed">
            <defs>
                {useGradient && (
                    <>
                        <linearGradient id="mixedBarGrad-0" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color1} stopOpacity="1" />
                            <stop offset="100%" stopColor={color1} stopOpacity="0.7" />
                        </linearGradient>
                        <linearGradient id="mixedBarGrad-hero" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color1} stopOpacity="1" />
                            <stop offset="100%" stopColor={color1} stopOpacity="0.9" />
                        </linearGradient>
                    </>
                )}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassLineFilter('glassLineFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('glassPointFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-0`, color1) }} />
                    </>
                )}
            </defs>

            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={`grid-${i}`} x1={0} y1={chartHeight * f} x2={chartWidth} y2={chartHeight * f}
                        stroke={CHART_THEME.colors.neutral.lighter} strokeWidth={1} opacity={0.1} strokeDasharray={"4 4"} />
                ))}

                {/* Vertical Milestones / Crosshairs */}
                {isInfographic && valuesBar.map((_, i) => {
                    const isManualHero = heroValueIndex === i;
                    if (!isManualHero && (!finalUseMetadata || !datasetBars.metadata?.[i])) return null;
                    const x = i * slotWidth + slotWidth / 2;
                    return (
                        <line key={`vguide-${i}`} x1={x} y1={0} x2={x} y2={chartHeight}
                            stroke={isManualHero ? color1 : CHART_THEME.colors.neutral.lighter}
                            strokeWidth={isManualHero ? 1 : 0.5} opacity={isManualHero ? 0.3 : 0.1}
                            strokeDasharray={isManualHero ? undefined : "4 4"} />
                    );
                })}

                {/* Bars Layer */}
                {valuesBar.map((value, i) => {
                    const barHeight = (value / maxValue) * chartHeight;
                    const x = i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = chartHeight - barHeight;
                    const isManualHero = heroValueIndex === i;
                    const barColor = isManualHero ? color1 : (style?.colorPalette?.[i % (style.colorPalette?.length || 1)] || getChartColor(i));

                    return (
                        <g key={`bar-${i}`}>
                            <rect
                                x={x} y={y} width={barWidth} height={barHeight}
                                fill={
                                    style?.finish === 'glass'
                                        ? `url(#glassGradient-0)`
                                        : (useGradient ? (isManualHero ? "url(#mixedBarGrad-hero)" : "url(#mixedBarGrad-0)") : barColor)
                                }
                                rx={isInfographic ? 6 : 0}
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.5 : 1}
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                            />

                            {/* Bar Value Label - Infographic */}
                            {isInfographic && (isManualHero || finalShowAllLabels || value / maxValue > 0.6) && (
                                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle"
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small') * (isManualHero ? 1.2 : 1)}
                                    fontFamily={valueFont} fontWeight={isManualHero ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                    fill={CHART_THEME.colors.neutral.dark} opacity={isManualHero ? 1 : 0.7}>
                                    {value}
                                </text>
                            )}

                            <text
                                x={i * slotWidth + slotWidth / 2}
                                y={effectiveBaselineY + 20}
                                textAnchor="middle"
                                fontSize={fontSize}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic && isManualHero ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.6 : 1}
                                style={{ textTransform: isInfographic ? 'uppercase' : 'none' }}
                            >
                                <title>{labels[i]}</title>
                                {wrappedLabels[i].map((line, lineIdx) => (
                                    <tspan key={lineIdx} x={i * slotWidth + slotWidth / 2} dy={lineIdx === 0 ? 0 : fontSize * 1.2}>
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        </g>
                    )
                })}

                {/* Line Layer */}
                {datasetLine && (
                    <>
                        <polyline
                            fill="none" stroke={isInfographic ? color1 : color2}
                            strokeWidth={isInfographic ? 5 : 2}
                            strokeLinecap="round" strokeLinejoin="round"
                            points={polylinePoints}
                            filter={style?.finish === 'glass' ? "url(#glassLineFilter)" : (isInfographic ? "url(#chartShadow)" : undefined)}
                            opacity={isInfographic ? 0.8 : (style?.finish === 'glass' ? 0.9 : 1)}
                        />
                        {linePoints.map((p, i) => {
                            const isManualHero = heroValueIndex === i;
                            const showLineLabel = isInfographic && (isManualHero || finalShowAllLabels || valuesLine[i] / maxValue > 0.8);
                            return (
                                <g key={`dot-${i}`}>
                                    <circle
                                        cx={p.x} cy={p.y}
                                        r={isInfographic ? (isManualHero ? 8 : 4) : 3}
                                        fill={isInfographic ? (isManualHero ? "#fff" : color1) : (style?.finish === 'glass' ? color2 : "#fff")}
                                        stroke={isInfographic ? color1 : (style?.finish === 'glass' ? "none" : color2)}
                                        strokeWidth={isInfographic ? 3 : 2}
                                        filter={style?.finish === 'glass' ? "url(#glassPointFilter)" : undefined}
                                    />
                                    {showLineLabel && (
                                        <text x={p.x} y={p.y - (isManualHero ? 15 : 10)} textAnchor="middle"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small') * (isManualHero ? 1.2 : 0.9)}
                                            fontFamily={valueFont} fontWeight={isManualHero ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.bold}
                                            fill={color1}>
                                            {valuesLine[i]}
                                        </text>
                                    )}

                                    {/* Editorial Badge for Hero in Mixed Chart */}
                                    {isInfographic && isManualHero && (
                                        <text x={p.x} y={-25} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                            fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} letterSpacing="0.1em" fill={color1}>
                                            {finalAnnotationLabels?.[i]?.toUpperCase() || "DESTAQUE COMBINADO"}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </>
                )}

                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.1 : 0.3} />
            </g>
        </BaseChart>
    );
}
