import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor } from '@/utils/chartTheme';
import { getIcon, getIconComponent } from '@/utils/iconLibrary';

interface PictogramChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

/**
 * Pictogram Chart - Icons repeated to represent quantities
 * Example: 5 person icons = 5000 people (if valuePerIcon = 1000)
 */
export function PictogramChart({ width, height, data, style }: PictogramChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    // Smart Margins for Pictogram
    // Left needs space for labels (textAnchor=end at x=-10)
    const marginLeft = 100;
    const marginTop = 20;
    const marginBottom = 20;
    const marginRight = 20;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;

    const iconCategory = data.iconConfig?.category || 'people';
    const iconKey = data.iconConfig?.iconKey || 'person';
    const IconComponent = getIconComponent(iconCategory, iconKey);

    // Calculate how many units each icon represents
    const maxValue = Math.max(...values);
    const valuePerIcon = Math.ceil(maxValue / 15); // Max 15 icons per row

    const iconSize = 24;
    const iconGap = 8;
    const rowHeight = chartHeight / values.length;
    const maxIconsPerRow = Math.floor(chartWidth / (iconSize + iconGap));

    return (
        <BaseChart width={width} height={height} data={data} type="pictogram">
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {values.map((value, rowIndex) => {
                    const iconCount = Math.round(value / valuePerIcon);
                    const y = rowIndex * rowHeight;

                    return (
                        <g key={rowIndex}>
                            {/* Label */}
                            <text
                                x={-10}
                                y={y + rowHeight / 2 - 15}
                                textAnchor="end"
                                fontSize={CHART_THEME.fontSizes.medium}
                                fontFamily={fontFamily}
                                fontWeight={CHART_THEME.fontWeights.semibold}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {labels[rowIndex]}
                            </text>

                            {/* Value with unit */}
                            <text
                                x={-10}
                                y={y + rowHeight / 2 + 5}
                                textAnchor="end"
                                fontSize={CHART_THEME.fontSizes.small}
                                fontFamily={fontFamily}
                                fontWeight={CHART_THEME.fontWeights.normal}
                                fill={CHART_THEME.colors.neutral.medium}
                            >
                                {value.toLocaleString()}
                            </text>

                            {/* Icons */}
                            {IconComponent && Array.from({ length: iconCount }).map((_, i) => {
                                const col = i % maxIconsPerRow;
                                const row = Math.floor(i / maxIconsPerRow);
                                const x = col * (iconSize + iconGap);
                                const iconY = y + row * (iconSize + iconGap) + 10;

                                return (
                                    <IconComponent
                                        key={i}
                                        x={x + 2}
                                        y={iconY + 2}
                                        width={iconSize - 4}
                                        height={iconSize - 4}
                                        color={primaryColor}
                                        strokeWidth={2}
                                        fill={primaryColor}
                                        fillOpacity={0.2}
                                    />
                                );
                            })}

                            {/* Legend: "Each icon = X units" */}
                            {rowIndex === 0 && (
                                <text
                                    x={0}
                                    y={-10}
                                    fontSize={CHART_THEME.fontSizes.tiny}
                                    fontFamily={fontFamily}
                                    fill={CHART_THEME.colors.neutral.medium}
                                    fontStyle="italic"
                                >
                                    {IconComponent && `Cada ícone = ${valuePerIcon.toLocaleString()}`}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
