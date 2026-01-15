import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';

interface LineChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function LineChart({ width, height, data, style }: LineChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';
    const maxValue = Math.max(...values);
    const padding = isInfographic ? CHART_THEME.padding.large : CHART_THEME.padding.medium;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Points calculation
    const points = values.map((value, i) => {
        const x = (i / (values.length - 1)) * chartWidth;
        const y = chartHeight - ((value / maxValue) * chartHeight);
        return `${x},${y}`;
    }).join(' ');

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    return (
        <BaseChart width={width} height={height} data={data} type="line">
            <g transform={`translate(${padding}, ${padding})`}>
                {/* Grid lines - only in classic mode */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const y = chartHeight * fraction;
                    return (
                        <line
                            key={i}
                            x1={0}
                            y1={y}
                            x2={chartWidth}
                            y2={y}
                            stroke={CHART_THEME.colors.neutral.lighter}
                            strokeWidth={CHART_THEME.strokeWidths.grid || 1}
                            opacity={0.15}
                        />
                    );
                })}

                {/* Axes - subtle in both modes, invisible in infographic */}
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

                {/* Line with elegant stroke - thicker in infographic */}
                <polyline
                    fill="none"
                    stroke={primaryColor}
                    strokeWidth={isInfographic ? 4 : CHART_THEME.strokeWidths.line}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />

                {/* Data points with refined styling */}
                {values.map((value, i) => {
                    const x = (i / (values.length - 1)) * chartWidth;
                    const y = chartHeight - ((value / maxValue) * chartHeight);
                    return (
                        <g key={i}>
                            {/* Point - larger in infographic */}
                            <circle
                                cx={x}
                                cy={y}
                                r={isInfographic ? 6 : 4}
                                fill="#fff"
                                stroke={primaryColor}
                                strokeWidth={isInfographic ? 3 : 2.5}
                            />

                            {/* Label */}
                            <text
                                x={x}
                                y={chartHeight + 20}
                                textAnchor="middle"
                                fontSize={isInfographic ? CHART_THEME.fontSizes.medium : CHART_THEME.fontSizes.small}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.medium}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {labels[i]}
                            </text>

                            {/* Value above point - GIANT in infographic */}
                            <text
                                x={x}
                                y={y - (isInfographic ? 20 : 12)}
                                textAnchor="middle"
                                fontSize={isInfographic ? CHART_THEME.fontSizes.huge : CHART_THEME.fontSizes.small}
                                fontFamily={CHART_THEME.fonts.number}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}

                {/* Axis labels */}
                {data.xAxisLabel && (
                    <text
                        x={chartWidth / 2}
                        y={chartHeight + 45}
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.xAxisLabel}
                    </text>
                )}
                {data.yAxisLabel && (
                    <text
                        x={-chartHeight / 2}
                        y={-25}
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                        transform={`rotate(-90, ${-chartHeight / 2}, -25)`}
                    >
                        {data.yAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
