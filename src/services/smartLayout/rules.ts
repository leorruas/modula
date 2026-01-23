import { LayoutRules } from './types';
import { barRules } from './rules/barRules';

export function getRulesForType(chartType: string): LayoutRules {
    switch (chartType) {
        case 'bar':
            return barRules;
        default:
            // Default rules for unknown types
            return {
                idealAspectRatio: 1.33,
                preferredOrientation: 'any',
                legendPosition: 'bottom',
                marginPriority: ['all-equal'],
                minPlotWidth: 0.5
            };
    }
}
