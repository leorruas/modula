import { ChartData, ChartStyle } from '@/types';
import { BaseChart } from './BaseChart';

interface RadarChartProps {
    width: number;
    height: number;
    data: ChartData;
    style?: ChartStyle;
}

export function RadarChart({ width, height, data, style }: RadarChartProps) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const labels = data.labels;

    const maxValue = Math.max(...values, 1);
    const centerX = width / 2;
    const centerY = height / 2;
    // Leave space for labels
    const radius = Math.min(width, height) / 2 - 40;

    const primaryColor = style?.colorPalette[0] || 'rgba(0,0,0,0.5)';
    const strokeColor = style?.colorPalette[1] || '#333';
    const fontFamily = style?.fontFamily || 'sans-serif';

    const numAxes = labels.length;
    const angleSlice = (2 * Math.PI) / numAxes;

    // Calculate polygon points
    const points = values.map((val, i) => {
        const angle = i * angleSlice - Math.PI / 2; // Start from top
        const r = (val / maxValue) * radius;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <BaseChart width={width} height={height} data={data} type="radar">
            <g>
                {/* Axes and Grid */}
                {[0.25, 0.5, 0.75, 1].map((scale, s) => (
                    <polygon
                        key={s}
                        points={labels.map((_, i) => {
                            const angle = i * angleSlice - Math.PI / 2;
                            const r = radius * scale;
                            return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis Lines */}
                {labels.map((label, i) => {
                    const angle = i * angleSlice - Math.PI / 2;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    // Label position (slightly further out)
                    const lx = centerX + (radius + 15) * Math.cos(angle);
                    const ly = centerY + (radius + 15) * Math.sin(angle);

                    return (
                        <g key={i}>
                            <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#ddd" />
                            <text
                                x={lx}
                                y={ly}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fontFamily={fontFamily}
                                fill="#666"
                            >
                                {label}
                            </text>
                        </g>
                    );
                })}

                {/* Data Polygon */}
                <polygon
                    points={points}
                    fill={primaryColor}
                    fillOpacity={0.4}
                    stroke={strokeColor}
                    strokeWidth={2}
                />

                {/* Data Points */}
                {values.map((val, i) => {
                    const angle = i * angleSlice - Math.PI / 2;
                    const r = (val / maxValue) * radius;
                    const x = centerX + r * Math.cos(angle);
                    const y = centerY + r * Math.sin(angle);
                    return (
                        <circle key={i} cx={x} cy={y} r={3} fill={strokeColor} />
                    );
                })}
            </g>
        </BaseChart>
    );
}
