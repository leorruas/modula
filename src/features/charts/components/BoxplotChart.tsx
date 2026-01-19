import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';
import { CHART_THEME, getScaledFont } from '@/utils/chartTheme';

interface BoxplotChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
    baseFontSize?: number;
    baseFontUnit?: 'pt' | 'px' | 'mm';
}

export function BoxplotChart({ width, height, data, style, baseFontSize = 11, baseFontUnit = 'pt' }: BoxplotChartProps) {
    const labels = data.labels;
    // We expect 5 datasets for Min, Q1, Median, Q3, Max
    // If fewer, we try to use what we have, but ideally 5.
    const datasets = data.datasets;

    // Fallback if not enough data
    if (!datasets || datasets.length < 5) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', textAlign: 'center' }}>
                Boxplot requer 5 séries:<br />Min, Q1, Median, Q3, Max
            </div>
        );
    }

    const minValues = datasets[0].data;
    const q1Values = datasets[1].data;
    const medianValues = datasets[2].data;
    const q3Values = datasets[3].data;
    const maxValues = datasets[4].data;

    // Determine Y scale
    const allValues = [
        ...minValues, ...q1Values, ...medianValues, ...q3Values, ...maxValues
    ];
    const minValue = Math.min(...allValues, 0); // Include 0? Usually yes.
    const maxValue = Math.max(...allValues);

    const padding = 30; // More padding for axis
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Scale function
    const mapY = (val: number) => {
        const range = maxValue - minValue || 1;
        // SVG Y is top-down. Max value at 0 (top), Min at height (bottom)
        return chartHeight - ((val - minValue) / range) * chartHeight;
    };

    const categoryWidth = chartWidth / labels.length;
    const boxWidth = categoryWidth * 0.4;

    const primaryColor = style?.colorPalette?.[0] || 'black';
    const fontFamily = style?.fontFamily || 'sans-serif';

    return (
        <BaseChart width={width} height={height} data={data} type="boxplot">
            <g transform={`translate(${padding}, ${padding})`}>
                {/* Axis Line */}
                <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#ccc" />
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#ccc" />

                {/* Grid Lines (Optional - could be improved) */}
                <line x1={0} y1={mapY(0)} x2={chartWidth} y2={mapY(0)} stroke="#eee" strokeDasharray="4 4" />

                {labels.map((label, i) => {
                    const cx = i * categoryWidth + categoryWidth / 2;

                    const yMin = mapY(minValues[i]);
                    const yQ1 = mapY(q1Values[i]);
                    const yMedian = mapY(medianValues[i]);
                    const yQ3 = mapY(q3Values[i]);
                    const yMax = mapY(maxValues[i]);

                    return (
                        <g key={i}>
                            {/* Whiskers */}
                            {/* Bottom Whisker (Min to Q1) */}
                            <line x1={cx} y1={yMin} x2={cx} y2={yQ1} stroke="black" strokeWidth="1" />
                            {/* Top Whisker (Q3 to Max) */}
                            <line x1={cx} y1={yQ3} x2={cx} y2={yMax} stroke="black" strokeWidth="1" />

                            {/* Whisker Caps */}
                            <line x1={cx - boxWidth / 2} y1={yMin} x2={cx + boxWidth / 2} y2={yMin} stroke="black" strokeWidth="1" />
                            <line x1={cx - boxWidth / 2} y1={yMax} x2={cx + boxWidth / 2} y2={yMax} stroke="black" strokeWidth="1" />

                            {/* Box (Q1 to Q3) */}
                            {/* Rect height is distance between Q1 and Q3 */}
                            {/* SVG Rect y is top-left. yQ3 is above yQ1 visually, so numerically smaller Y? No, yQ3 (value higher) -> smaller Y coord. Correct. */}
                            {/* So y is yQ3, height is yQ1 - yQ3 */}
                            <rect
                                x={cx - boxWidth / 2}
                                y={yQ3}
                                width={boxWidth}
                                height={Math.max(0, yQ1 - yQ3)}
                                fill="transparent"
                                stroke={primaryColor}
                                strokeWidth="2"
                            />

                            {/* Median Line */}
                            <line
                                x1={cx - boxWidth / 2}
                                y1={yMedian}
                                x2={cx + boxWidth / 2}
                                y2={yMedian}
                                stroke={primaryColor}
                                strokeWidth="3"
                            />

                            {/* Label */}
                            <text
                                x={cx}
                                y={chartHeight + 15}
                                textAnchor="middle"
                                fontSize={getScaledFont(baseFontSize, baseFontUnit, 'tiny')}
                                fontFamily={fontFamily}
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}
            </g>
        </BaseChart>
    );
}
