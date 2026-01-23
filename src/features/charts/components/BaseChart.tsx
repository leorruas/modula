import { Chart } from '@/types';
import { ReactNode } from 'react';

interface BaseChartProps {
    width: number;
    height: number;
    data: Chart['data'];
    type: Chart['type'];
    children: ReactNode;
    legend?: ReactNode;
    legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
}

export function BaseChart({ width, height, children, type, legend, legendPosition = 'bottom' }: BaseChartProps) {
    if (legendPosition === 'none') {
        legend = null;
    }

    const isSide = legendPosition === 'left' || legendPosition === 'right';
    const isBottom = legendPosition === 'bottom';

    return (
        <div style={{
            width,
            height,
            position: 'relative',
            display: 'flex',
            flexDirection: isSide ? 'row' : (isBottom ? 'column-reverse' : 'column'),
            gap: 16,
            alignItems: isSide ? 'center' : 'stretch',
            overflow: 'visible'
        }}>
            {legend && (
                <div style={{
                    flexShrink: 0,
                    maxWidth: isSide ? '30%' : '100%',
                    padding: isSide ? '0 8px' : '0'
                }}>
                    {legend}
                </div>
            )}
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
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
                    {children}
                </svg>
            </div>
        </div>
    );
}
