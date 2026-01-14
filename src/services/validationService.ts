
import { Chart, GridConfig } from '@/types';

export interface ValidationResult {
    chartId: string;
    level: 'warning' | 'error';
    message: string;
}

export class ValidationService {
    static validateProject(charts: Chart[], gridConfig: GridConfig): ValidationResult[] {
        const results: ValidationResult[] = [];

        charts.forEach(chart => {
            // 1. Density Check (Heuristic)
            // If data points > area * (some factor), warn
            const area = chart.module.w * chart.module.h; // in modules
            // Assume 50 points per module is dense
            const dataPoints = chart.data.datasets[0].data.length;

            if (dataPoints > area * 50) {
                results.push({
                    chartId: chart.id,
                    level: 'warning',
                    message: `High data density: ${dataPoints} points in ${area} module(s). Consider resizing.`
                });
            }

            // 2. Overlap Check (Basic) - this should ideally be prevented by UI, but good to check
            // (Skipped for simplicity in this MVP, assumed handled by grid logic)

            // 3. Label Legibility (Heuristic)
            // If font size is small relative to chart height? 
            // We just check if style font is monospace (hard to read for body text maybe?) or if custom size provided (not yet).
        });

        return results;
    }
}
