import { LayoutRules } from './types';
import { barRules } from './rules/barRules';
import { radialRules } from './rules/radialRules';

export function getRulesForType(chartType: string): LayoutRules {
    switch (chartType) {
        case 'bar':
            return barRules;
        case 'pie':
        case 'donut':
            return radialRules;
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
