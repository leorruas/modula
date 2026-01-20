import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont, getChartColor, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';

interface BoxplotChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function BoxplotChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: BoxplotChartProps) {
    const datasets = data.datasets;
    if (!datasets || datasets.length < 5) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', textAlign: 'center' }}>
                Boxplot requer 5 séries:<br />Min, Q1, Median, Q3, Max
            </div>
        );
    }

    const labels = data.labels || [];
    const minValues = datasets[0].data;
    const q1Values = datasets[1].data;
    const medianValues = datasets[2].data;
    const q3Values = datasets[3].data;
    const maxValues = datasets[4].data;

    const allValues = [...minValues, ...q1Values, ...medianValues, ...q3Values, ...maxValues];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;

    // Infographic spacing
    const padding = isInfographic ? 60 : 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2 - (isInfographic ? 20 : 0);

    const mapY = (val: number) => {
        const range = maxValue - minValue || 1;
        return chartHeight - ((val - minValue) / range) * chartHeight;
    };

    const categoryWidth = chartWidth / labels.length;
    const boxWidth = categoryWidth * (isInfographic ? 0.35 : 0.4);

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;

    return (
        <BaseChart width={width} height={height} data={data} type="boxplot">
            <defs>
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient`, primaryColor) }} />
                    </>
                )}
            </defs>
            <g transform={`translate(${padding}, ${padding})`}>
                {!isInfographic && (
                    <>
                        <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#ccc" />
                        <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ccc" />
                    </>
                )}

                {labels.map((label, i) => {
                    const cx = i * categoryWidth + categoryWidth / 2;
                    const yMin = mapY(minValues[i]);
                    const yQ1 = mapY(q1Values[i]);
                    const yMedian = mapY(medianValues[i]);
                    const yQ3 = mapY(q3Values[i]);
                    const yMax = mapY(maxValues[i]);

                    return (
                        <g key={i}>
                            {/* Whiskers - Infographic Style */}
                            <line x1={cx} y1={yMin} x2={cx} y2={yQ1} stroke={isInfographic ? primaryColor : "black"}
                                strokeWidth={isInfographic ? 2 : 1} opacity={isInfographic ? 0.4 : 1} />
                            <line x1={cx} y1={yQ3} x2={cx} y2={yMax} stroke={isInfographic ? primaryColor : "black"}
                                strokeWidth={isInfographic ? 2 : 1} opacity={isInfographic ? 0.4 : 1} />

                            {/* Whisker Caps */}
                            <line x1={cx - boxWidth / 3} y1={yMin} x2={cx + boxWidth / 3} y2={yMin} stroke={isInfographic ? primaryColor : "black"} />
                            <line x1={cx - boxWidth / 3} y1={yMax} x2={cx + boxWidth / 3} y2={yMax} stroke={isInfographic ? primaryColor : "black"} />

                            {/* Box */}
                            <rect
                                x={cx - boxWidth / 2}
                                y={yQ3}
                                width={boxWidth}
                                height={Math.max(0, yQ1 - yQ3)}
                                fill={style?.finish === 'glass' ? "url(#glassGradient)" : (isInfographic ? primaryColor : "transparent")}
                                fillOpacity={isInfographic ? 0.1 : 1}
                                stroke={primaryColor}
                                strokeWidth={isInfographic ? 3 : 2}
                                rx={isInfographic ? 4 : 0}
                                filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                            />

                            {/* Median Line */}
                            <line
                                x1={cx - boxWidth / 2}
                                y1={yMedian}
                                x2={cx + boxWidth / 2}
                                y2={yMedian}
                                stroke={primaryColor}
                                strokeWidth={isInfographic ? 4 : 3}
                                strokeLinecap="round"
                            />

                            {/* Infographic Labels */}
                            {isInfographic && (
                                <g>
                                    {/* Median Value Badge */}
                                    <text x={cx + boxWidth / 2 + 8} y={yMedian} dominantBaseline="middle"
                                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')}
                                        fontFamily={valueFont} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.dark}>
                                        {medianValues[i]}
                                    </text>

                                    {/* Top Label (Max) */}
                                    <text x={cx} y={yMax - 15} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                        fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.05em">
                                        PICO {maxValues[i]}
                                    </text>

                                    {/* Bottom Label (Min) */}
                                    <text x={cx} y={yMin + 20} textAnchor="middle" fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                        fontFamily={fontFamily} fontWeight={CHART_THEME.fontWeights.black} fill={CHART_THEME.colors.neutral.medium} letterSpacing="0.05em">
                                        MIN {minValues[i]}
                                    </text>
                                </g>
                            )}

                            {/* Axis Category Label */}
                            <text
                                x={cx}
                                y={chartHeight + 25}
                                textAnchor="middle"
                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'small' : 'tiny')}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                                style={{ textTransform: isInfographic ? 'uppercase' : 'none' }}
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
