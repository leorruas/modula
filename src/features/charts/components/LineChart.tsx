import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont } from '@/utils/chartTheme';
import { ensureDistinctColors } from '@/utils/colors';

interface LineChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function LineChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: LineChartProps) {
    if (!data.datasets || data.datasets.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const labels = data.labels || [];
    const isInfographic = style?.mode === 'infographic';

    // Calculate global max value across all datasets
    const allValues = data.datasets.flatMap(d => d.data || []);
    const maxValue = Math.max(...allValues, 0); // avoid -Infinity if empty

    const padding = isInfographic ? 40 : 0;

    // Smart Margins
    const marginTop = isInfographic ? 60 : 12; // Minimal space for values
    const marginRight = isInfographic ? 40 : (isInfographic ? padding : CHART_THEME.padding.small);
    // Calculated dynamically below
    let marginBottom = (isInfographic ? padding : CHART_THEME.padding.small) + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 0);
    const marginLeft = isInfographic ? 60 : (isInfographic ? padding : CHART_THEME.padding.small) + (data.yAxisLabel ? CHART_THEME.spacing.axisTitle : 25);

    const chartWidth = width - marginLeft - marginRight;
    // Initial guess, will refine after wrapLabel logic
    // const initialChartHeight = height - marginTop - marginBottom; // This line is removed as per instruction

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

    marginBottom = (isInfographic ? padding : CHART_THEME.padding.small) + (data.xAxisLabel ? CHART_THEME.spacing.axisTitle : 0) + labelBottomPadding;
    const chartHeight = height - marginTop - marginBottom;
    const effectiveBaselineY = chartHeight;

    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    // Color logic: distinct color per dataset
    const baseColors = style?.colorPalette || [getChartColor(0)];
    const computedColors = ensureDistinctColors(baseColors, data.datasets.length);

    // Legend Component
    const Legend = data.datasets.length > 1 ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {data.datasets.map((ds, i) => (ds.label && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: computedColors[i % computedColors.length] }} />
                    <span style={{ fontSize: getScaledFont(baseFontSize, baseFontUnit, 'small'), color: '#444', fontFamily }}>{ds.label}</span>
                </div>
            )))}
        </div>
    ) : null;

    return (
        <BaseChart width={width} height={height} data={data} type="line" legend={Legend}>
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
                            opacity={0.1}
                            strokeDasharray="4 4"
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
                                filter="url(#chartShadow)"
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
                                                        x={x}
                                                        dy={lineIdx === 0 ? 0 : fontSize * 1.2}
                                                    >
                                                        {line}
                                                    </tspan>
                                                ))}
                                            </text>
                                        )}

                                        {/* Value Label - Show for all points */}
                                        <text
                                            x={x}
                                            y={y - (isInfographic ? 20 : 12)}
                                            textAnchor="middle"
                                            fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'large' : 'small', isInfographic)}
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
