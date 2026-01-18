import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';

interface MixedChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function MixedChart({ width, height, data, style }: MixedChartProps) {
    // Mixed Chart Strategy: 
    // Dataset 0 -> Column (Bars)
    // Dataset 1 -> Line
    const datasetBars = data.datasets[0];
    const datasetLine = data.datasets.length > 1 ? data.datasets[1] : null;

    const labels = data.labels;
    const valuesBar = datasetBars.data;
    const valuesLine = datasetLine ? datasetLine.data : [];

    const allValues = [...valuesBar, ...valuesLine];
    const maxValue = Math.max(...allValues, 1);

    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = (chartWidth / valuesBar.length) * 0.6; // 60% width

    const color1 = style?.colorPalette[0] || '#ccc';
    const color2 = style?.colorPalette[1] || '#000';
    const fontFamily = style?.fontFamily || 'sans-serif';

    // Line Points
    const linePoints = valuesLine.map((value, i) => {
        const x = (i / (valuesBar.length - 1 || 1)) * chartWidth; // Center alignment?
        // Actually for mixed, bars are centered in slots. Line points should align with bar centers.
        // Bar center X = i * slotWidth + slotWidth/2
        const slotWidth = chartWidth / valuesBar.length;
        const cx = i * slotWidth + slotWidth / 2;
        const y = chartHeight - ((value / maxValue) * chartHeight);
        return `${cx},${y}`;
    }).join(' ');

    return (
        <BaseChart width={width} height={height} data={data} type="mixed">
            <g transform={`translate(${padding}, ${padding})`}>
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#eee" />

                {/* Bars Layer */}
                {valuesBar.map((value, i) => {
                    const slotWidth = chartWidth / valuesBar.length;
                    const barHeight = (value / maxValue) * chartHeight;
                    const x = i * slotWidth + (slotWidth - barWidth) / 2;
                    const y = chartHeight - barHeight;
                    const barColor = style?.colorPalette?.[i % (style.colorPalette?.length || 1)] || color1;

                    return (
                        <g key={`bar-${i}`}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={barColor}
                            />
                            <text
                                x={i * slotWidth + slotWidth / 2}
                                y={chartHeight + 15}
                                textAnchor="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                                fill="#666"
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
                            strokeWidth="2"
                            points={linePoints}
                        />
                        {valuesLine.map((value, i) => {
                            const slotWidth = chartWidth / valuesBar.length;
                            const cx = i * slotWidth + slotWidth / 2;
                            const cy = chartHeight - ((value / maxValue) * chartHeight);
                            return (
                                <circle key={`dot-${i}`} cx={cx} cy={cy} r={3} fill={color2} stroke="white" strokeWidth={1} />
                            )
                        })}
                    </>
                )}
            </g>
        </BaseChart>
    );
}
