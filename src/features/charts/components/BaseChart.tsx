import { Chart } from '@/types';
import { ReactNode } from 'react';

interface BaseChartProps {
    width: number;
    height: number;
    data: Chart['data'];
    type: Chart['type'];
    children: ReactNode;
    legend?: ReactNode;
}

export function BaseChart({ width, height, children, type, legend }: BaseChartProps) {
    return (
        <div style={{
            width,
            height,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
        }}>
            {legend && <div>{legend}</div>}
            <div style={{ flex: 1, position: 'relative' }}>
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
