import { ChartData, ChartStyle, GridConfig } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { useSmartLayout } from '@/hooks/useSmartLayout';
import { ComputedLayout } from '@/services/smartLayout/types';
import { smartFormatChartValue } from '@/utils/formatters';

interface DonutChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
    gridConfig?: GridConfig;
    computedLayout?: ComputedLayout;
}

export function DonutChart({
    width,
    height,
    data,
    style,
    baseFontSize = 11,
    baseFontUnit = 'pt',
    gridConfig,
    computedLayout: propsComputedLayout
}: DonutChartProps) {
    // 1. Hook into Smart Layout Engine
    const smartLayout = useSmartLayout(
        { type: 'donut', data, style },
        gridConfig || { baseFontSize } as GridConfig,
        { w: width, h: height }
    );

    const layout = propsComputedLayout || smartLayout;
    const {
        centerX = width / 2,
        centerY = height / 2,
        outerRadius = 0,
        innerRadius = 0,
        innerRadii = [],
        datasetColors,
        labelPlacements,
        spiderLegs
    } = layout.typeSpecific || {};

    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0 || !centerX) {
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
    const finalLegendPosition = infographicConfig.legendPosition || 'top';

    const useGradient = style?.useGradient;
    const colors = datasetColors || style?.colorPalette || ['#333'];
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;

    let startAngle = 0;

    // Legend Component (Simplified extraction)
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
                        width: 10, height: 10, marginTop: 4, flexShrink: 0, borderRadius: 2, background: colors[i % colors.length]
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
            </defs>

            <g transform={`translate(${centerX}, ${centerY})`}>
                {values.map((value, i) => {
                    const sliceAngle = (value / total) * 2 * Math.PI;
                    const endAngle = startAngle + sliceAngle;

                    const currentInnerRadius = innerRadii?.[i] || innerRadius;

                    const x1 = outerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y1 = outerRadius * Math.sin(startAngle - Math.PI / 2);
                    const x2 = outerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y2 = outerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x3 = currentInnerRadius * Math.cos(endAngle - Math.PI / 2);
                    const y3 = currentInnerRadius * Math.sin(endAngle - Math.PI / 2);
                    const x4 = currentInnerRadius * Math.cos(startAngle - Math.PI / 2);
                    const y4 = currentInnerRadius * Math.sin(startAngle - Math.PI / 2);

                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
                    const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${currentInnerRadius} ${currentInnerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        `Z`
                    ].join(' ');

                    const placement = labelPlacements?.[i];
                    const isManualHero = heroValueIndex === i;

                    const sliceResult = (
                        <g key={i}>
                            <path
                                d={pathData}
                                fill={useGradient ? `url(#donutGradient-${i % colors.length})` : colors[i % colors.length]}
                                stroke="#fff"
                                strokeWidth={isInfographic ? (isManualHero ? 1 : 0.5) : 1}
                                opacity={isInfographic && heroValueIndex !== undefined && !isManualHero ? 0.7 : 1}
                            />

                            {placement && placement.strategy !== 'hidden' && (
                                <g>
                                    {/* Value Badge (Optional) */}
                                    {isInfographic && isManualHero && finalShowValueAnnotations && (
                                        <text x={placement.x} y={placement.y - 24} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                            fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium}>
                                            {(finalAnnotationLabels?.[i] || "DESTAQUE").toUpperCase()}
                                        </text>
                                    )}

                                    {/* Category Label */}
                                    {placement.wrappedLines.map((line, idx) => (
                                        <text
                                            key={idx}
                                            x={placement.x}
                                            y={placement.y + (placement.strategy === 'internal' ? -12 : 12) + (idx * 12)}
                                            textAnchor={placement.textAnchor}
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                            fontFamily={fontFamily}
                                            fill={placement.strategy === 'internal' ? placement.color : CHART_THEME.colors.neutral.dark}
                                            style={{ textTransform: 'uppercase', opacity: placement.strategy === 'internal' ? 0.8 : 1 }}
                                        >
                                            {line}
                                        </text>
                                    ))}

                                    {/* Percentage or Formatted Value */}
                                    <text
                                        x={placement.x}
                                        y={placement.y + (placement.strategy === 'internal' ? 6 : 0)}
                                        textAnchor={placement.textAnchor}
                                        dominantBaseline="middle"
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, placement.strategy === 'internal' ? 'huge' : 'tiny', true)}
                                        fontFamily={valueFont}
                                        fontWeight={CHART_THEME.fontWeights.black}
                                        fill={placement.strategy === 'internal' ? placement.color : CHART_THEME.colors.neutral.dark}
                                    >
                                        {style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number'
                                            ? smartFormatChartValue(value, style.numberFormat)
                                            : placement.formattedValue // Uses Engine's pre-calculated %
                                        }
                                    </text>
                                </g>
                            )}
                        </g>
                    );

                    startAngle += sliceAngle;
                    return sliceResult;
                })}

                {/* Spider Legs Rendering */}
                {spiderLegs?.map((leg, idx) => (
                    <polyline
                        key={`leg-${idx}`}
                        points={leg.points.join(' ')}
                        fill="none"
                        stroke={CHART_THEME.colors.neutral.medium}
                        strokeWidth={0.5}
                        strokeDasharray="2,2"
                    />
                ))}

                {/* Center Hero Narrative */}
                {isInfographic && innerRadius > 0 && (
                    <g pointerEvents="none">
                        {heroValueIndex !== undefined ? (
                            <>
                                <text y={-innerRadius * 0.4} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                    fontFamily={fontFamily} fill={CHART_THEME.colors.neutral.medium}>
                                    {labels[heroValueIndex]?.toUpperCase()}
                                </text>
                                <text y={5} textAnchor="middle" fontSize={innerRadius * 0.35}
                                    fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                    {style?.numberFormat?.type === 'currency' || style?.numberFormat?.type === 'number'
                                        ? smartFormatChartValue(dataset.data[heroValueIndex], style.numberFormat)
                                        : `${((dataset.data[heroValueIndex] / total) * 100).toFixed(1)}%`
                                    }
                                </text>
                            </>
                        ) : (
                            <text y={5} textAnchor="middle" fontSize={innerRadius * 0.6}
                                fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                {smartFormatChartValue(total, style?.numberFormat)}
                            </text>
                        )}
                    </g>
                )}
            </g>
        </BaseChart>
    );
}
