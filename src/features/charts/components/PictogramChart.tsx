import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont } from '@/utils/chartTheme';
import { getIcon, getIconComponent } from '@/utils/iconLibrary';

interface PictogramChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function PictogramChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: PictogramChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const marginLeft = 100;
    const marginTop = 20;
    const marginBottom = 20;
    const marginRight = 20;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const useGradient = style?.useGradient;
    const isInfographic = style?.mode === 'infographic';

    const iconCategory = data.iconConfig?.category || 'people';
    const iconKey = data.iconConfig?.iconKey || 'person';
    const IconComponent = getIconComponent(iconCategory, iconKey);

    const maxValue = Math.max(...values, 1);
    const valuePerIcon = Math.ceil(maxValue / (isInfographic ? 10 : 15));

    const iconSize = isInfographic ? 36 : 24;
    const iconGap = isInfographic ? 12 : 8;
    const rowHeight = chartHeight / values.length;
    const maxIconsPerRow = Math.floor(chartWidth / (iconSize + iconGap));

    return (
        <BaseChart width={width} height={height} data={data} type="pictogram">
            <defs>
                {useGradient && style?.colorPalette?.map((color, i) => (
                    <radialGradient key={`grad-${i}`} id={`pictogramGrad-${i}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.7" />
                    </radialGradient>
                ))}
                {useGradient && !style?.colorPalette && (
                    <radialGradient id="pictogramGrad-default" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
                    </radialGradient>
                )}
            </defs>
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {values.map((value, rowIndex) => {
                    const iconCount = Math.round(value / valuePerIcon);
                    const y = rowIndex * rowHeight;
                    const rowColor = style?.colorPalette?.[rowIndex % (style.colorPalette?.length || 1)] || getChartColor(rowIndex);

                    return (
                        <g key={rowIndex}>
                            <text
                                x={-10}
                                y={y + rowHeight / 2 - (isInfographic ? 20 : 15)}
                                textAnchor="end"
                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'large' : 'medium')}
                                fontFamily={fontFamily}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.bold : CHART_THEME.fontWeights.semibold}
                                fill={CHART_THEME.colors.neutral.dark}
                            >
                                {labels[rowIndex]}
                            </text>

                            <text
                                x={-10}
                                y={y + rowHeight / 2 + (isInfographic ? 10 : 5)}
                                textAnchor="end"
                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small')}
                                fontFamily={fontFamily}
                                fontWeight={CHART_THEME.fontWeights.normal}
                                fill={CHART_THEME.colors.neutral.medium}
                            >
                                {value.toLocaleString()}
                            </text>

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
                                        color={useGradient ? (style?.colorPalette ? `url(#pictogramGrad-${rowIndex % style.colorPalette.length})` : "url(#pictogramGrad-default)") : rowColor}
                                        strokeWidth={1}
                                        fill={useGradient ? (style?.colorPalette ? `url(#pictogramGrad-${rowIndex % style.colorPalette.length})` : "url(#pictogramGrad-default)") : rowColor}
                                        fillOpacity={1}
                                    />
                                );
                            })}

                            {rowIndex === 0 && (
                                <text
                                    x={0}
                                    y={-10}
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'small' : 'tiny')}
                                    fontFamily={fontFamily}
                                    fill={CHART_THEME.colors.neutral.medium}
                                    fontStyle="italic"
                                    fontWeight={isInfographic ? CHART_THEME.fontWeights.semibold : CHART_THEME.fontWeights.normal}
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
