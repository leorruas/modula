import { ChartData, ChartStyle, GridConfig } from '@/types';
import {
    ChartAnalysis,
    ComputedLayout,
    LayoutRules,
    ModeModifiers,
    Zone
} from './types';
import { getRulesForType } from './rules';
import { textMeasurementService } from './TextMeasurementService';
import { MODE_MULTIPLIERS, EXPORT_DRIFT_BUFFER } from './constants';

export class SmartLayoutEngine {
    /**
     * Phase 1: Analyze the chart data and extract complexity metrics
     */
    public static analyzeChart(
        chart: { type: string; data: ChartData; style?: ChartStyle },
        gridConfig: GridConfig,
        module: { w: number; h: number }
    ): ChartAnalysis {
        const { data, style } = chart;
        const categories = data.labels || [];
        const datasets = data.datasets || [];

        // Extract max/min values
        const allValues = datasets.flatMap(d => d.data || []);
        const maxValue = Math.max(...allValues, 1);
        const minValue = Math.min(...allValues, 0);

        // Measure label widths using TextMeasurementService (Rule 5.1: Measurement-First)
        const baseFontSize = gridConfig.baseFontSize || 11;
        const fontFamily = style?.fontFamily || 'Inter, sans-serif';
        const fontWeight = style?.mode === 'infographic' ? '700' : '500';

        const maxLabelWidthPx = categories.length > 0
            ? Math.max(...categories.map(label =>
                textMeasurementService.measureTextWidth({
                    text: label,
                    fontSize: baseFontSize,
                    fontFamily,
                    fontWeight
                })
            ))
            : 0;

        // Measure value widths
        const maxValueWidthPx = textMeasurementService.measureTextWidth({
            text: String(Math.round(maxValue)),
            fontSize: baseFontSize,
            fontFamily,
            fontWeight: '500'
        });

        // Determine mode
        const mode = style?.mode || 'classic';

        // Check if legend is needed
        const userLegendPosition = style?.legendPosition;
        const needsLegend = userLegendPosition !== 'none' && datasets.length > 1;

        return {
            chartType: chart.type || 'bar',
            mode,
            dataComplexity: {
                categoryCount: categories.length,
                datasetCount: datasets.length,
                maxValue,
                minValue,
                maxLabelWidthPx,
                maxValueWidthPx
            },
            layoutRequirements: {
                needsLegend,
                needsAxisLabels: true,
                userLegendPosition
            },
            availableSpace: {
                width: module.w,
                height: module.h,
                aspectRatio: module.w / module.h
            }
        };
    }

    /**
     * Phase 2: Compute the final layout with exact pixel values
     */
    public static computeLayout(
        chart: { type: string; data: ChartData; style?: ChartStyle },
        gridConfig: GridConfig,
        module: { w: number; h: number }
    ): ComputedLayout {
        // Step 1: Analyze the chart
        const analysis = this.analyzeChart(chart, gridConfig, module);

        // Step 2: Get rules for this chart type
        const rules = getRulesForType(analysis.chartType);

        // Step 3: Get mode modifiers
        const modeConfig = this.getModeModifiers(analysis.mode);

        // Step 4: Compute margins
        const margins = this.computeDynamicMargins(analysis, rules, modeConfig);

        // Step 5: Calculate plot zone
        const plotZone: Zone = {
            x: margins.left,
            y: margins.top,
            width: analysis.availableSpace.width - margins.left - margins.right,
            height: analysis.availableSpace.height - margins.top - margins.bottom
        };

        // Step 6: Calculate legend zone (if needed)
        let legendZone: Zone | null = null;
        if (analysis.layoutRequirements.needsLegend) {
            const legendPosition = analysis.layoutRequirements.userLegendPosition || rules.legendPosition;

            if (legendPosition === 'bottom') {
                legendZone = {
                    x: margins.left,
                    y: analysis.availableSpace.height - margins.bottom + 10,
                    width: plotZone.width,
                    height: margins.bottom - 20
                };
            }
            // TODO: Implement other legend positions
        }

        // Step 7: Vertical Fill Strategy (Sub-Project 1.2)
        // Calculate optimal bar thickness to fill vertical space intelligently
        let barThickness: number | undefined;
        if (analysis.chartType === 'bar') {
            const categoryCount = analysis.dataComplexity.categoryCount || 1;
            const spacePerCategory = plotZone.height / categoryCount;

            // Density-aware scaling (Rule 5.5.12: Grid Elasticity)
            const density = categoryCount / (plotZone.height / 100); // categories per 100px

            let targetFillRatio = 0.7; // Default: 70% fill
            let maxThickness = 60; // Default cap (Sub-Project 1.3: Scale Safety)

            if (density < 1.0 && plotZone.height > 300) {
                // Low density, large container: allow thicker bars
                targetFillRatio = 0.75;
                maxThickness = 80;
            } else if (density > 4.0) {
                // High density: thinner bars
                targetFillRatio = 0.6;
                maxThickness = 40;
            }

            const datasetCount = analysis.dataComplexity.datasetCount || 1;
            const divider = datasetCount > 1 ? datasetCount : 1;

            barThickness = (spacePerCategory * targetFillRatio) / divider;
            barThickness = Math.min(barThickness, maxThickness);
            barThickness = Math.max(barThickness, 12); // Minimum readable size
        }

        return {
            container: {
                width: analysis.availableSpace.width,
                height: analysis.availableSpace.height
            },
            zones: {
                plot: plotZone,
                legend: legendZone,
                xAxis: null, // TODO: Implement in later phases
                yAxis: null
            },
            margins,
            scaling: {
                factor: 1.0,
                appliedTo: []
            },
            typeSpecific: {
                barThickness
            }
        };
    }

    /**
     * Helper: Calculate dynamic margins based on content
     */
    private static computeDynamicMargins(
        analysis: ChartAnalysis,
        rules: LayoutRules,
        mode: ModeModifiers
    ): { top: number; right: number; bottom: number; left: number } {
        const { dataComplexity, layoutRequirements } = analysis;

        // Base margins
        let marginLeft = 40;
        let marginRight = 40;
        let marginTop = 20;
        let marginBottom = 20;

        // LEFT: Based on label width (priority for bar charts)
        if (rules.marginPriority.includes('left')) {
            marginLeft = Math.max(60, dataComplexity.maxLabelWidthPx + 20);
            marginLeft *= mode.marginMultiplier;
        }

        // RIGHT: Based on value width
        if (rules.marginPriority.includes('right')) {
            marginRight = Math.max(40, dataComplexity.maxValueWidthPx + 30);
        }

        // BOTTOM: Reserve space for legend if needed
        if (layoutRequirements.needsLegend &&
            (layoutRequirements.userLegendPosition === 'bottom' || rules.legendPosition === 'bottom')) {
            marginBottom = 60 * mode.marginMultiplier;
        } else {
            marginBottom = 30;
        }

        // TOP: Minimal for now
        marginTop = 20 * mode.marginMultiplier;

        return { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft };
    }

    /**
     * Helper: Get mode-specific multipliers
     */
    private static getModeModifiers(mode: 'classic' | 'infographic'): ModeModifiers {
        return MODE_MULTIPLIERS[mode];
    }
}
