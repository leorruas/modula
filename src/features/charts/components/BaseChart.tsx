import { Chart } from '@/types';
import { ReactNode } from 'react';

interface BaseChartProps {
    width: number;
    height: number;
    data: Chart['data'];
    type: Chart['type'];
    children: ReactNode;
}

export function BaseChart({ width, height, children, type }: BaseChartProps) {
    return (
        <div style={{ width, height, position: 'relative' }}>
            <svg width={width} height={height} style={{ overflow: 'visible' }}>
                {children}
            </svg>
        </div>
    ); // Simple wrapper for now, can be extended for common axes/legends later
}
