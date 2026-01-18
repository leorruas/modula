import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';
import { ensureDistinctColors } from '@/utils/colors';

interface LineChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function LineChart({ width, height, data, style }: LineChartProps) {
    const labels = data.labels;

    const isInfographic = style?.mode === 'infographic';

    // Calculate global max value across all datasets
    const allValues = data.datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues, 0); // avoid -Infinity if empty

    const padding = isInfographic ? CHART_THEME.padding.medium : CHART_THEME.padding.small;

    // Smart Margins
    const marginTop = padding;
    const marginRight = padding;
    const marginBottom = padding + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 20);
    const marginLeft = padding + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 25); // Line chart usually has numbers on left

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    // Color logic: distinct color per dataset
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, data.datasets.length);

    return (
        <BaseChart width={width} height={height} data={data} type="line">
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {/* Grid lines - only in classic mode */}
                {!isInfographic && [0.25, 0.5, 0.75, 1].map((fraction, i) => {
                    const y = chartHeight * fraction;
                    return (
                        <line
                            key={`grid-${i}`}
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

                {/* Render Datasets */}
                {data.datasets.map((dataset, dsIndex) => {
                    const color = computedColors[dsIndex % computedColors.length];
                    const values = dataset.data;

                    // Points calculation
                    const points = values.map((value, i) => {
                        const x = (i / (values.length - 1)) * chartWidth;
                        const y = chartHeight - ((value / maxValue) * chartHeight);
                        return `${x},${y}`;
                    }).join(' ');

                    return (
                        <g key={`dataset-${dsIndex}`}>
                            {/* Line */}
                            <polyline
                                fill="none"
                                stroke={color}
                                strokeWidth={isInfographic ? 4 : CHART_THEME.strokeWidths.line}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={points}
                            />

                            {/* Points & Labels */}
                            {values.map((value, i) => {
                                const x = (i / (values.length - 1)) * chartWidth;
                                const y = chartHeight - ((value / maxValue) * chartHeight);
                                return (
                                    <g key={`point-${i}`}>
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={isInfographic ? 6 : 4}
                                            fill="#fff"
                                            stroke={color}
                                            strokeWidth={isInfographic ? 3 : 2.5}
                                        />

                                        {/* Show label only for first dataset to avoid clutter? 
                                            Or show for all? For simplicity, keeping existing logic:
                                            Label is X-axis label, Value is data label.
                                        */}

                                        {/* X-axis Label (Category) - Show only once (e.g. at bottom) */}
                                        {dsIndex === 0 && (
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
                                        )}

                                        {/* Value Label - Show for all points */}
                                        <text
                                            x={x}
                                            y={y - (isInfographic ? 20 : 12)}
                                            textAnchor="middle"
                                            fontSize={isInfographic ? CHART_THEME.fontSizes.huge : CHART_THEME.fontSizes.small}
                                            fontFamily={CHART_THEME.fonts.number}
                                            fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.semibold}
                                            fill={color} // Use line color for value to distinguish
                                        >
                                            {value}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* Axis Title Labels */}
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
                        transform={`rotate(-90)`}
                        x={-chartHeight / 2}
                        y={-marginLeft + 15} // Position relative to new left margin
                        textAnchor="middle"
                        fontSize={CHART_THEME.fontSizes.medium}
                        fontFamily={CHART_THEME.fonts.title}
                        fontWeight={CHART_THEME.fontWeights.semibold}
                        fill={CHART_THEME.colors.neutral.medium}
                    >
                        {data.yAxisLabel}
                    </text>
                )}
            </g>
        </BaseChart>
    );
}
