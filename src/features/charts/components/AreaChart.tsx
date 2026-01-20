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


    // Smart Margins
    const basePadding = isInfographic ? 40 : 0;
    const marginTop = isInfographic ? 60 : 12;
    const marginRight = isInfographic ? 40 : CHART_THEME.padding.small;
    const marginLeft = isInfographic ? 60 : (isInfographic ? basePadding : CHART_THEME.padding.small) + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 25);

    const chartWidth = width - marginLeft - marginRight;

    const fontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = fontSize * 0.5;
    const maxLines = 3;
    const maxCharsPerLine = Math.floor((chartWidth / Math.max(labels.length, 1)) / charWidth);

    const wrapLabel = (text: string) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            if ((currentLine + ' ' + words[i]).length <= maxCharsPerLine) {
                currentLine += ' ' + words[i];
            } else {
                lines.push(currentLine);
                currentLine = words[i];
            }
        }
        lines.push(currentLine);
        return lines.slice(0, maxLines);
    };

    const wrappedLabels = labels.map(wrapLabel);
    const maxLinesNeeded = Math.max(...wrappedLabels.map(l => l.length), 1);
    const labelBottomPadding = (maxLinesNeeded * fontSize * 1.2) + 20;

    const marginBottom = (isInfographic ? basePadding : CHART_THEME.padding.small) + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 0) + labelBottomPadding;
    const chartHeight = height - marginTop - marginBottom;
    const effectiveBaselineY = chartHeight;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const points = values.map((value, i) => {
        const x = (i / (values.length - 1)) * chartWidth;
        const y = chartHeight - ((value / maxValue) * chartHeight);
        return { x, y };
    });

    const areaPath = [
        `M 0 ${chartHeight}`,
        ...points.map(p => `L ${p.x} ${p.y}`),
        `L ${chartWidth} ${chartHeight}`,
        `Z`
    ].join(' ');

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const useGradient = style?.useGradient;

    // Legend Component
    const Legend = data.datasets.length > 1 ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {data.datasets.map((ds, i) => (ds.label && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: getChartColor(i),
                        ...(style?.finish === 'glass' && {
                            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(0,0,0,0.1))',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        })
                    }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily: CHART_THEME.fonts.label }}>{ds.label}</span>
                </div>
            )))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="area" legend={Legend}>
            <defs>
                {useGradient && (
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="0.9" />
                        <stop offset="70%" stopColor={primaryColor} stopOpacity="0.85" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
                    </linearGradient>
                )}
                {/* Glass Definitions */}
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
                {/* Grid - only classic */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => (
                    <line
                        key={i}
                        x1={0}
                        y1={chartHeight * fraction}
                        x2={chartWidth}
                        y2={chartHeight * fraction}
                        stroke={CHART_THEME.colors.neutral.lighter}
                        strokeWidth={1}
                        opacity={0.1}
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill={style?.finish === 'glass' ? "url(#glassAreaGradient)" : (useGradient ? "url(#areaGradient)" : primaryColor)}
                    fillOpacity={style?.finish === 'glass' ? 1 : (useGradient ? 1 : 0.3)}
                    filter={style?.finish === 'glass' ? "url(#glassAreaFilter)" : undefined}
                />

                {/* Line outline */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth={isInfographic ? 3 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={style?.finish === 'glass' ? "url(#glassLineFilter)" : "url(#chartShadow)"}
                    strokeOpacity={style?.finish === 'glass' ? 0.8 : 1}
                />

                {/* Points and values */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={isInfographic ? 5 : 3}
                            fill={style?.finish === 'glass' ? primaryColor : "#fff"}
                            stroke={style?.finish === 'glass' ? "none" : primaryColor}
                            strokeWidth={2}
                            filter={style?.finish === 'glass' ? "url(#glassPointFilter)" : undefined}
                        />
                        <text
                            x={p.x}
                            y={p.y - (isInfographic ? 15 : 10)}
                            textAnchor="middle"
                            fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'large' : 'small', isInfographic)}
                            fontFamily={CHART_THEME.fonts.number}
                            fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                            fill={CHART_THEME.colors.neutral.dark}
                        >
                            {values[i]}
                        </text>
                        <text
                            x={p.x}
                            y={effectiveBaselineY + 20}
                            textAnchor="middle"
                            fontSize={fontSize}
                            fontFamily={fontFamily}
                            fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                            fill={CHART_THEME.colors.neutral.dark}
                        >
                            <title>{labels[i]}</title>
                            {wrappedLabels[i].map((line, lineIdx) => (
                                <tspan
                                    key={lineIdx}
                                    x={p.x}
                                    dy={lineIdx === 0 ? 0 : fontSize * 1.2}
                                >
                                    {line}
                                </tspan>
                            ))}
                        </text>
                    </g>
                ))}

                {/* Axes */}
                <line
                    x1={0}
                    y1={chartHeight}
                    x2={chartWidth}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
                <line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={chartHeight}
                    stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis}
                    opacity={isInfographic ? 0.1 : CHART_THEME.effects.axisOpacity}
                />
            </g>
        </BaseChart>
    );
}
