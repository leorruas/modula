import { ChartData, ChartStyle } from '@/types';

/**
 * Determines the type of a specific dataset in a Mixed Chart.
 * 
 * Logic:
 * 1. If `style.datasetTypes` exists, use the type defined at that index.
 * 2. Fallback (Legacy):
 *    - If total datasets <= 1: 'bar'
 *    - If total datasets > 1:
 *      - Last dataset = 'line'
 *      - All others = 'bar'
 */
export function getMixedChartDatasetType(
    index: number,
    totalDatasets: number,
    style?: ChartStyle
): 'bar' | 'line' {
    // 1. Explicit Configuration
    if (style?.datasetTypes && style.datasetTypes[index]) {
        return style.datasetTypes[index];
    }

    // 2. Fallback Logic
    if (totalDatasets <= 1) return 'bar';

    // If it's the last one, it's a line, otherwise bar
    return index === totalDatasets - 1 ? 'line' : 'bar';
}
