import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getChartColor, getScaledFont, createIOSGlassFilter, createGlassGradient } from '@/utils/chartTheme';
import { getIconComponent } from '@/utils/iconLibrary';
import { smartFormatChartValue } from '@/utils/formatters';

interface PictogramChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function PictogramChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: PictogramChartProps) {
    const dataset = data.datasets?.[0];
    if (!dataset || !dataset.data || dataset.data.length === 0) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 12 }}>No data available</div>;
    }
    const values = dataset.data;
    const labels = data.labels || [];

    const isInfographic = style?.mode === 'infographic';
    const primaryColor = style?.colorPalette?.[0] || getChartColor(0);
    const fontFamily = style?.fontFamily || CHART_THEME.fonts.label;
    const valueFont = isInfographic ? (CHART_THEME.fonts.data || 'monospace') : CHART_THEME.fonts.number;
    const useGradient = style?.useGradient;

    // Layout margins
    const marginLeft = isInfographic ? 140 : 100; // Increased for wrapped labels
    const marginTop = isInfographic ? 40 : 20;
    const marginBottom = isInfographic ? 40 : 20;
    const marginRight = 20;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    const iconCategory = data.iconConfig?.category || 'people';
    const iconKey = data.iconConfig?.iconKey || 'person';
    const IconComponent = getIconComponent(iconCategory, iconKey);

    const maxValue = Math.max(...values, 1);
    const valuePerIcon = data.iconConfig?.valuePerIcon || Math.ceil(maxValue / (isInfographic ? 12 : 15));

    const iconSize = isInfographic ? 32 : 24;
    const iconGap = isInfographic ? 10 : 8;
    const rowHeight = chartHeight / values.length;
    const maxIconsPerRow = Math.floor(chartWidth / (iconSize + iconGap));

    // Label Wrapping
    const labelFontSize = getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'medium' : 'small');
    const charWidth = labelFontSize * 0.6;
    const maxCharsPerLine = Math.floor((marginLeft - 20) / charWidth) || 15;

    const wrapLabel = (text: string) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let cur = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            if ((cur + ' ' + words[i]).length <= maxCharsPerLine) {
                cur += ' ' + words[i];
            } else {
                lines.push(cur);
                cur = words[i];
            }
        }
        lines.push(cur);
        return lines.slice(0, 3);
    };

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
                {/* Glass Definitions */}
                {style?.finish === 'glass' && (
                    <>
                        <g dangerouslySetInnerHTML={{ __html: createIOSGlassFilter('iosGlassFilter') }} />
                        {(style?.colorPalette || [primaryColor]).map((color, i) => (
                            <g key={`glass-grad-${i}`} dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-${i}`, color) }} />
                        ))}
                        {!style?.colorPalette && (
                            <g dangerouslySetInnerHTML={{ __html: createGlassGradient(`glassGradient-default`, primaryColor) }} />
                        )}
                    </>
                )}
            </defs>
            <g transform={`translate(${marginLeft}, ${marginTop})`}>
                {/* Legend: Value per Icon (Infographic styling) */}
                {isInfographic && IconComponent && (
                    <g transform={`translate(0, ${chartHeight + 25})`}>
                        <text
                            x={chartWidth}
                            y={0}
                            textAnchor="end"
                            fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                            fontFamily={fontFamily}
                            fill={CHART_THEME.colors.neutral.medium}
                            fontWeight={CHART_THEME.fontWeights.medium}
                            letterSpacing="0.05em"
                            style={{ textTransform: 'uppercase' }}
                        >
                            Cada ícone = <tspan fontWeight={CHART_THEME.fontWeights.bold} fill={CHART_THEME.colors.neutral.dark}>{smartFormatChartValue(valuePerIcon, style?.numberFormat)}</tspan>
                        </text>
                    </g>
                )}

                {!isInfographic && IconComponent && (
                    <text
                        x={0}
                        y={-10}
                        fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                        fontFamily={fontFamily}
                        fill={CHART_THEME.colors.neutral.medium}
                        fontStyle="italic"
                    >
                        {`Cada ícone = ${smartFormatChartValue(valuePerIcon, style?.numberFormat)}`}
                    </text>
                )}

                {values.map((value, rowIndex) => {
                    const iconCount = Math.max(1, Math.round(value / valuePerIcon));
                    const y = rowIndex * rowHeight;
                    const rowContainerHeight = Math.min(rowHeight, (Math.ceil(iconCount / maxIconsPerRow) + 1) * (iconSize + iconGap));
                    const verticalOffset = (rowHeight - (Math.ceil(Math.min(iconCount, maxIconsPerRow * 2) / maxIconsPerRow) * (iconSize + iconGap))) / 2;
                    const rowColor = style?.colorPalette?.[rowIndex % (style.colorPalette?.length || 1)] || getChartColor(rowIndex);
                    const wrappedLabels = wrapLabel(labels[rowIndex]);

                    return (
                        <g key={rowIndex}>
                            {/* Category Label (Wrapped) */}
                            {wrappedLabels.map((line, idx) => (
                                <text
                                    key={idx}
                                    x={-15}
                                    y={y + rowHeight / 2 - (isInfographic ? 25 : 20) + (idx * labelFontSize * 1.1) - ((wrappedLabels.length - 1) * labelFontSize * 0.5)}
                                    textAnchor="end"
                                    fontSize={labelFontSize}
                                    fontFamily={fontFamily}
                                    fontWeight={isInfographic ? CHART_THEME.fontWeights.bold : CHART_THEME.fontWeights.semibold}
                                    fill={CHART_THEME.colors.neutral.dark}
                                    style={{ textTransform: isInfographic ? 'uppercase' : 'none' }}
                                >
                                    {line}
                                </text>
                            ))}

                            {/* Value Label */}
                            <text
                                x={-15}
                                y={y + rowHeight / 2 + (isInfographic ? 20 : 15) + ((wrappedLabels.length - 1) * 6)}
                                textAnchor="end"
                                fontSize={getScaledFont(baseFontSize, baseFontUnit, isInfographic ? 'large' : 'medium')}
                                fontFamily={valueFont}
                                fontWeight={isInfographic ? CHART_THEME.fontWeights.black : CHART_THEME.fontWeights.normal}
                                fill={isInfographic ? rowColor : CHART_THEME.colors.neutral.medium}
                            >
                                {smartFormatChartValue(value, style?.numberFormat)}
                            </text>

                            {/* Separator Line */}
                            {isInfographic && (
                                <line x1={-10} y1={y + rowHeight / 2} x2={-marginLeft + 10} y2={y + rowHeight / 2}
                                    stroke={CHART_THEME.colors.neutral.lighter} strokeWidth={1} opacity={0.3} strokeDasharray="2 2" />
                            )}

                            {/* Icons Grid */}
                            {IconComponent && Array.from({ length: iconCount }).map((_, i) => {
                                const col = i % maxIconsPerRow;
                                const row = Math.floor(i / maxIconsPerRow);
                                if (row > 3 && isInfographic) return null;

                                const x = col * (iconSize + iconGap);
                                const iconY = y + verticalOffset + row * (iconSize + iconGap);

                                return (
                                    <IconComponent
                                        key={i} x={x} y={iconY} width={iconSize} height={iconSize}
                                        color={style?.finish === 'glass' ? `url(#glassGradient-${rowIndex % (style.colorPalette?.length || 1)})` : (useGradient ? `url(#pictogramGrad-${rowIndex % (style.colorPalette?.length || 1)})` : rowColor)}
                                        strokeWidth={isInfographic ? 1.5 : 1}
                                        fill={style?.finish === 'glass' ? `url(#glassGradient-${rowIndex % (style.colorPalette?.length || 1)})` : (useGradient ? `url(#pictogramGrad-${rowIndex % (style.colorPalette?.length || 1)})` : rowColor)}
                                        fillOpacity={isInfographic ? 0.9 : 1}
                                        filter={style?.finish === 'glass' ? "url(#iosGlassFilter)" : undefined}
                                    />
                                );
                            })}

                            {/* Overflow Indicator */}
                            {isInfographic && iconCount > (maxIconsPerRow * 4) && (
                                <text x={maxIconsPerRow * (iconSize + iconGap) + 10} y={y + rowHeight / 2} dominantBaseline="middle"
                                    fontSize={getScaledFont(baseFontSize, baseFontUnit, 'small')} fill={CHART_THEME.colors.neutral.medium}>
                                    + {(iconCount - (maxIconsPerRow * 4))}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
