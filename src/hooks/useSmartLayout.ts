import { useMemo } from 'react';
import { ChartData, ChartStyle, GridConfig } from '@/types';
import { SmartLayoutEngine } from '@/services/smartLayout/SmartLayoutEngine';
import { ComputedLayout } from '@/services/smartLayout/types';

export function useSmartLayout(
    chart: { type: string; data: ChartData; style?: ChartStyle },
    gridConfig: GridConfig,
    module: { w: number; h: number }
): ComputedLayout {
    return useMemo(() => {
        return SmartLayoutEngine.computeLayout(chart, gridConfig, module);
    }, [chart.type, chart.data, chart.style, gridConfig, module.w, module.h]);
}
