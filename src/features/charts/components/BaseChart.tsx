import { Chart } from '@/types';
import { ReactNode } from 'react';

interface BaseChartProps {
    width: number;
    height: number;
    chartWidth?: number;  // Optional: logical width for SVG content
    chartHeight?: number; // Optional: logical height for SVG content
    data: Chart['data'];
    type: Chart['type'];
    children: ReactNode;
    legend?: ReactNode;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
    isLoading?: boolean;
}

// SUB-PROJECT 1.34: SKELETON LAYOUT PREDICTION
// Renders a type-aware gray skeleton to prevent Layout Shift.
function ChartSkeleton({ width, height, type }: { width: number, height: number, type: Chart['type'] }) {
    return (
        <g opacity={0.3}>
            {/* Axis Lines */}
            <line x1={40} y1={height - 20} x2={width - 20} y2={height - 20} stroke="#e5e7eb" strokeWidth="2" />
            <line x1={40} y1={20} x2={40} y2={height - 20} stroke="#e5e7eb" strokeWidth="2" />

            {/* Type Specific Shapes */}
            {type === 'bar' && Array.from({ length: 5 }).map((_, i) => (
                <rect key={i} x={45} y={30 + (i * (height - 60) / 5)} width={width * 0.6} height={(height - 60) / 8} rx={4} fill="#e5e7eb" />
            ))}
            {type === 'column' && Array.from({ length: 5 }).map((_, i) => (
                <rect key={i} x={50 + (i * (width - 60) / 5)} y={height - 20 - (height * 0.6)} width={(width - 60) / 8} height={height * 0.6} rx={4} fill="#e5e7eb" />
            ))}
            {(type === 'pie' || type === 'donut') && (
                <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 3} fill="none" stroke="#e5e7eb" strokeWidth={type === 'donut' ? 40 : 0} fillOpacity={type === 'pie' ? 1 : 0} />
            )}
            {(type === 'line' || type === 'area') && (
                <polyline points={`40,${height - 30} ${width * 0.25},${height - 80} ${width * 0.5},${height - 50} ${width * 0.75},${height - 100} ${width - 20},${height - 40}`} fill="none" stroke="#e5e7eb" strokeWidth="3" />
            )}

            <text x={width / 2} y={height / 2} textAnchor="middle" fill="#9ca3af" fontSize={12} fontFamily="sans-serif">Loading...</text>
        </g>
    );
}

export function BaseChart({ width, height, chartWidth, chartHeight, children, type, legend, legendPosition = 'bottom', isLoading }: BaseChartProps) {
    if (legendPosition === 'none') {
        legend = null;
    }

    const isSide = legendPosition === 'left' || legendPosition === 'right';
    const isBottom = legendPosition === 'bottom';
    const isRight = legendPosition === 'right';

    // SVG viewBox uses provided chartWidth/chartHeight or falls back to container width/height
    const viewWidth = chartWidth || width;
    const viewHeight = chartHeight || height;

    return (
        <div style={{
            width,
            height,
            position: 'relative',
            display: 'flex',
            flexDirection: isSide ? (isRight ? 'row-reverse' : 'row') : (isBottom ? 'column-reverse' : 'column'),
            gap: 8, // Reduced from 16
            alignItems: isSide ? 'center' : 'stretch',
            overflow: 'visible'
        }}>
            {/* Logic: If loading, we hide legend or render skeleton legend? Usually just hide legend during skeleton. */}
            {!isLoading && legend && (
                <div style={{
                    flexShrink: 0,
                    maxWidth: isSide ? '30%' : '100%',
                    padding: isSide ? '0 8px' : '0',
                    // SUB-PROJECT 1.27: COMPACT LEGEND GRID
                    // FIXED: Removed hardcoded 80px limit to prevent clipping. Engine handles height reservation.
                    maxHeight: isSide ? '100%' : 'none',
                    overflowY: isSide ? 'auto' : 'visible'
                }}>
                    {legend}
                </div>
            )}
            {/* SUB-PROJECT 1.36: GRID ELASTICITY */}
            {/* We ensure minWidth: 0 to allow flexbox shrinking, and flex: 1 to fill available space. */}
            {/* The SVG viewBox handles the aspect ratio scaling internally. */}
            <div style={{ flex: 1, position: 'relative', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                    style={{ overflow: 'visible' }}
                >
                    <defs>
                        <filter id="chartShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                            <feOffset dx="0" dy="2" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.1" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {isLoading ? <ChartSkeleton width={viewWidth} height={viewHeight} type={type} /> : children}
                </svg>
            </div>
        </div>
    );
}
