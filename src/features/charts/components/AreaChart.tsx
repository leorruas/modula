import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';

interface AreaChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function AreaChart({ width, height, data, style }: AreaChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';
    const maxValue = Math.max(...values);
    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

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
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    return (
        <BaseChart width={width} height={height} data={data} type="area">
            <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
                </linearGradient>
            </defs>

            <g transform={`translate(${padding}, ${padding})`}>
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
                        opacity={0.15}
                    />
                ))}

                {/* Area fill */}
                <path
                    d={areaPath}
                    fill="url(#areaGradient)"
                />

                {/* Line outline */}
                <path
                    d={linePath}
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth={isInfographic ? 3 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Points and values */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={isInfographic ? 5 : 3}
                            fill="#fff"
                            stroke={primaryColor}
                            strokeWidth={2}
                        />
                        <text
                            x={p.x}
                            y={p.y - (isInfographic ? 15 : 10)}
                            textAnchor="middle"
                            fontSize={isInfographic ? CHART_THEME.fontSizes.huge : CHART_THEME.fontSizes.small}
                            fontFamily={CHART_THEME.fonts.number}
                            fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                            fill={CHART_THEME.colors.neutral.dark}
                        >
                            {values[i]}
                        </text>
                        <text
                            x={p.x}
                            y={chartHeight + 20}
                            textAnchor="middle"
                            fontSize={isInfographic ? CHART_THEME.fontSizes.medium : CHART_THEME.fontSizes.small}
                            fontFamily={fontFamily}
                            fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                            fill={CHART_THEME.colors.neutral.dark}
                        >
                            {labels[i]}
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
