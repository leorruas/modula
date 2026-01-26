import { LayoutRules } from '../types';

/**
 * Radial Rules for circular charts (Pie, Donut, Radar)
 */
export const radialRules: LayoutRules = {
    idealAspectRatio: 1.0, // Strictly square plot area
    preferredOrientation: 'any',
    legendPosition: 'top',
    marginPriority: ['all-equal'], // Maintain symmetry
    minPlotWidth: 0.6,
};
