import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';

interface MixedChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function MixedChart({ width, height, data, style }: MixedChartProps) {
    const datasetBars = data.datasets[0];
    const datasetLine = data.datasets.length > 1 ? data.datasets[1] : null;

    const labels = data.labels;
    const valuesBar = datasetBars.data;
    const valuesLine = datasetLine ? datasetLine.data : [];

    const allValues = [...valuesBar, ...valuesLine];
    const maxValue = Math.max(...allValues, 1);

    const isInfographic = style?.mode === 'infographic';
    const useGradient = style?.useGradient;

    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = (chartWidth / valuesBar.length) * 0.7;

    const color1 = style?.colorPalette?.[0] || getChartColor(0);
    const color2 = style?.colorPalette?.[1] || getChartColor(1);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

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
                        {style?.colorPalette?.map((color, i) => (
                            <linearGradient key={`bar-grad-${i}`} id={`mixedBarGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="1" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                            </linearGradient>
                        ))}
                        {!style?.colorPalette && (
                            <linearGradient id="mixedBarGrad-default" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color1} stopOpacity="1" />
                                <stop offset="100%" stopColor={color1} stopOpacity="0.7" />
                            </linearGradient>
                        )}
                    </>
                )}
            </defs>
            <g transform={`translate(${padding}, ${padding})`}>
                {!isInfographic && (
                    <line
                        x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight}
                        stroke={CHART_THEME.colors.neutral.medium}
                        strokeWidth={1}
                        opacity={0.3}
                    />
                )}

                {/* Bars Layer */}
                {valuesBar.map((value, i) => {
                    const barHeight = (value / maxValue) * chartHeight;
                    const x = i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = chartHeight - barHeight;
                    const barColor = style?.colorPalette?.[i % (style.colorPalette?.length || 1)] || getChartColor(i);

                    return (
                        <g key={`bar-${i}`}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={useGradient ? (style?.colorPalette ? `url(#mixedBarGrad-${i % style.colorPalette.length})` : "url(#mixedBarGrad-default)") : barColor}
                                rx={isInfographic ? 4 : 0}
                            />
                            <text
                                x={i * slotWidth + slotWidth / 2}
                                y={chartHeight + 18}
                                textAnchor="middle"
                                fontSize={CHART_THEME.fontSizes.small}
                                fontFamily={fontFamily}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {labels[i]}
                            </text>
                        </g>
                    )
                })}

                {/* Line Layer */}
                {datasetLine && (
                    <>
                        <polyline
                            fill="none"
                            stroke={color2}
                            strokeWidth={isInfographic ? 4 : 2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePoints}
                        />
                        {linePoints.map((p, i) => (
                            <circle
                                key={`dot-${i}`}
                                cx={p.x} cy={p.y}
                                r={isInfographic ? 5 : 3}
                                fill="#fff"
                                stroke={color2}
                                strokeWidth={2}
                            />
                        ))}
                    </>
                )}
            </g>
        </BaseChart>
    );
}
