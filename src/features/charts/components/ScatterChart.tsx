import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont } from '@/utils/chartTheme';
import { SmartLayoutEngine } from '@/services/smartLayout/SmartLayoutEngine';
import { useMemo } from 'react';

interface ScatterChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function ScatterChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: ScatterChartProps) {
    const datasets = data.datasets || [];
    if (datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }

    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';
    const allValues = datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues, 1);

    // Infographic Config
    const infographicConfig = style?.infographicConfig || {};
    const heroValueIndex = infographicConfig.heroValueIndex;
    const finalShowValueAnnotations = infographicConfig.showValueAnnotations !== false;
    const finalLegendPosition = infographicConfig.legendPosition || 'top';
    const finalShowAllLabels = infographicConfig.showAllLabels || false;

    const padding = isInfographic ? 65 : 30;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    const useGradient = style?.useGradient;
    const palette = style?.colorPalette || datasets.map((_, i) => getChartColor(i));

    // Label Wrapping for Scatter
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

    // SUB-PROJECT 1.23: SMART COLLISION AVOIDANCE
    // Pre-calculate all label positions to resolve collisions
    const pointLabels = useMemo(() => {
        const candidates: Array<{ x: number, y: number, width: number, height: number, value: any, color: string, isHero: boolean, dsIdx: number, idx: number }> = [];

        datasets.forEach((ds, dsIdx) => {
            ds.data.forEach((v, i) => {
                const x = (i / Math.max(labels.length - 1, 1)) * chartWidth;
                const y = chartHeight - ((v / Math.max(maxValue, 1)) * chartHeight);
                const isManualHero = heroValueIndex === i && dsIdx === 0;
                const ratio = v / Math.max(maxValue, 1);

                // Should we show this label?
                // Logic: Show if (ShowAll OR (IsHero) OR (IsSignificant & FirstSeries))
                if (finalShowAllLabels || !isInfographic || (dsIdx === 0 && (isManualHero || !!ds.metadata?.[i] || ratio >= 0.8))) {
                    candidates.push({
                        x: x - (isManualHero ? 18 : 12), // Initial centered position (approx text width/2)
                        y: y - (isManualHero ? 30 : 20),
                        width: 24, // Estimate
                        height: 14,
                        value: v,
                        color: CHART_THEME.colors.neutral.dark,
                        isHero: isManualHero || false,
                        dsIdx,
                        idx: i
                    });
                }
            });
        });

        // Resolve!
        // TODO: Implement in FASE 4 (Sub-Project 1.23: Smart Collision Avoidance)
        // For now, return candidates as-is without collision resolution
        if (candidates.length > 0) {
            // const resolved = SmartLayoutEngine.resolveLabelCollisions(candidates, { width: chartWidth, height: chartHeight });
            // return candidates.map((c, i) => ({ ...c, x: resolved[i].x, y: resolved[i].y }));
            return candidates; // Use original positions for now
        }
        return [];
    }, [datasets, labels, chartWidth, chartHeight, maxValue, finalShowAllLabels, isInfographic, heroValueIndex]);

    // Legend Component
    const Legend = finalLegendPosition !== 'none' && datasets.length > 0 ? (
        <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '6px 12px',
            background: isInfographic ? 'rgba(0,0,0,0.02)' : 'transparent', borderRadius: 6
        }}>
            {datasets.map((ds, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: palette[i % palette.length], border: '1px solid #fff' }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'tiny'), color: '#666', fontFamily, fontWeight: CHART_THEME.fontWeights.semibold }}>
                        {ds.label || `Série ${i + 1}`}
                    </span>
                </div>
            ))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="scatter" legend={Legend} legendPosition={finalLegendPosition}>
            <defs>
                {useGradient && palette.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`scatterGradient-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                    </radialGradient>
                ))}
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
                {/* Hero Crosshairs */}
                {isInfographic && heroValueIndex !== undefined && (
                    <g opacity={0.2}>
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

                {/* Data Points */}
                {datasets.map((ds, dsIdx) => (
                    <g key={`ds-${dsIdx}`}>
                        {ds.data.map((v, i) => {
                            const x = (i / Math.max(labels.length - 1, 1)) * chartWidth;
                            const y = chartHeight - ((v / Math.max(maxValue, 1)) * chartHeight);
                            const isManualHero = heroValueIndex === i && dsIdx === 0;
                            const pointColor = palette[dsIdx % palette.length];

                            return (
                                <g key={i}>
                                    {isInfographic && isManualHero && (
                                        <circle cx={x} cy={y} r={18} fill={pointColor} opacity={0.1}>
                                            <animate attributeName="r" values="10;20;10" dur="2.5s" repeatCount="indefinite" />
                                        </circle>
                                    )}

                                    <circle cx={x} cy={y} r={isInfographic ? (isManualHero ? 8 : 5) : 5}
                                        fill={useGradient ? `url(#scatterGradient-${dsIdx % palette.length})` : pointColor}
                                        opacity={isInfographic ? (dsIdx === 0 ? 1 : 0.6) : 0.9}
                                        stroke="#fff" strokeWidth={isManualHero ? 2.5 : 2} />
                                </g>
                            );
                        })}
                    </g>
                ))}

                {/* Resolved Labels Rendered Separately using Engine Output */}
                {pointLabels.map((lbl, i) => (
                    <g key={`lbl-${i}`}>
                        <text x={lbl.x + lbl.width / 2} y={lbl.y + lbl.height / 2} textAnchor="middle" dominantBaseline="middle"
                            fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'small' : 'tiny', isInfographic) * (lbl.isHero ? 1.1 : 1)}
                            fontFamily={valueFont} fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                            fill={CHART_THEME.colors.neutral.dark} opacity={lbl.isHero ? 1 : 0.8}>
                            {lbl.value}
                        </text>
                    </g>
                ))}

                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={CHART_THEME.colors.neutral.medium}
                    strokeWidth={CHART_THEME.strokeWidths.axis} opacity={isInfographic ? 0.1 : 0.2} />
            </g>
        </BaseChart>
    );
}
