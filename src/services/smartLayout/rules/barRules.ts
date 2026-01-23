import { LayoutRules } from '../types';

export const barRules: LayoutRules = {
    idealAspectRatio: 1.5, // Landscape preference
    preferredOrientation: 'landscape',
    legendPosition: 'bottom',
    marginPriority: ['left', 'bottom', 'right', 'top'],
    minPlotWidth: 0.4 // At least 40% of width should be plot
};
