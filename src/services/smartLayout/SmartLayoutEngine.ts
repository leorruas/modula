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
import { SmartLabelWrapper } from './SmartLabelWrapper';
import { ColorService } from '@/services/color/ColorService';
import { getChartColor, getScaledFont } from '@/utils/chartTheme'; // Import helper
import { smartFormatChartValue } from '@/utils/formatters';

import {
    MODE_MULTIPLIERS,
    EXPORT_DRIFT_BUFFER,
    EXPORT_SAFETY_PADDING,
    MIN_PLOT_WIDTH_RATIO,
    LEGEND_ICON_SIZE,
    LEGEND_ICON_GAP,
    LEGEND_ITEM_PADDING,
    LEGEND_VERTICAL_GAP,
    LEGEND_FONT_SIZE_RATIO,
    LABEL_PADDING,
    LABEL_GUTTER,
    LABEL_LINE_HEIGHT_RATIO,
    MAX_LABEL_LINES,
    MIN_LABEL_WRAP_CHARS
} from './constants';

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

        // FASE 4.1: Smart measurement with Scaling

        // Core Layout Configuration
        const baseFontSize = gridConfig.baseFontSize || 11;
        const baseFontUnit = gridConfig.baseFontUnit || 'pt';
        const fontFamily = style?.fontFamily || 'Inter, sans-serif';
        // Calculate accurate font size matching BarChart logic
        // BarChart uses 'medium' usually, or 'small' if specified. Assumes medium as base.
        const isInfographic = style?.mode === 'infographic';
        const fontWeight = isInfographic ? '700' : '500';
        const letterSpacing = isInfographic ? 0.08 : 0; // FASE 4.5: Match Chart Rendering

        const effectiveLabelFontSize = getScaledFont(
            baseFontSize,
            baseFontUnit,
            'medium',
            isInfographic
        ) * (isInfographic ? 0.85 : 1); // Match BarChart scaling approach

        // Measure category label widths with accurate metrics
        const maxLabelWidthPx = categories.length > 0
            ? Math.max(...categories.map(label =>
                textMeasurementService.measureTextWidth({
                    text: label,
                    fontSize: effectiveLabelFontSize,
                    fontFamily,
                    fontWeight,
                    letterSpacing
                })
            ))
            : 0;

        // Measure value widths (Fix for Clipping)
        // Replicate BarChart font sizing logic
        const barsPerGroup = datasets.length;
        const fontCategory = isInfographic ? (barsPerGroup > 2 ? 'medium' : 'large') : 'small';

        const effectiveFontSizePx = getScaledFont(
            baseFontSize,
            baseFontUnit,
            fontCategory,
            isInfographic
        );

        // Max value (ratio 1.0) gets the largest multiplier in Infographic mode (Hero 2.0x * 1.3x override)
        const maxMult = isInfographic ? 2.6 : 1.0;
        const finalValueFontSize = effectiveFontSizePx * maxMult;

        // Format values for accurate measurement
        const numberFormat = style?.numberFormat;
        const formattedMax = smartFormatChartValue(maxValue, numberFormat);
        const formattedMin = smartFormatChartValue(minValue, numberFormat);

        // Measure both and take the wider one to be safe (unlikely min is wider unless negative with sign)
        const maxValWidth = textMeasurementService.measureTextWidth({
            text: formattedMax,
            fontSize: finalValueFontSize,
            fontFamily,
            fontWeight: isInfographic ? '900' : '600'
        }) * EXPORT_DRIFT_BUFFER;

        const minValWidth = textMeasurementService.measureTextWidth({
            text: formattedMin,
            fontSize: finalValueFontSize,
            fontFamily,
            fontWeight: isInfographic ? '900' : '600'
        }) * EXPORT_DRIFT_BUFFER;

        const maxValueWidthPx = Math.max(maxValWidth, minValWidth);

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
        module: { w: number; h: number },
        target: 'screen' | 'pdf' = 'screen'
    ): ComputedLayout {
        // Step 1: Analyze the chart
        const analysis = this.analyzeChart(chart, gridConfig, module);

        // Step 2: Get rules for this chart type
        const rules = getRulesForType(analysis.chartType);

        // Step 3: Get mode modifiers
        const modeConfig = this.getModeModifiers(analysis.mode);

        // Step 4: Compute margins with new parameters (FASE 1.2 + 1.3)
        const baseFontSize = gridConfig.baseFontSize || 11;
        const fontFamily = chart.style?.fontFamily || 'Inter, sans-serif';
        const datasets = chart.data.datasets || [];
        const categoryLabels = chart.data.labels || [];

        // FASE 4.2: Resolve colors early using ColorService
        const baseColors = chart.style?.colorPalette || [getChartColor(0)];
        const isSingleSeries = datasets.length === 1;
        // Logic replicated from BarChart: Single series -> color by category. Multi -> color by dataset.
        const datasetColors = ColorService.ensureDistinctColors(
            baseColors,
            isSingleSeries ? (categoryLabels.length || 1) : (datasets.length || 1)
        );

        let marginsResult = this.computeDynamicMargins(
            analysis,
            rules,
            modeConfig,
            datasets,
            categoryLabels,
            baseFontSize,
            fontFamily,
            target,
            analysis.layoutRequirements,
            analysis.dataComplexity
        );

        // FASE 3: Radial Layout Expansion
        if (analysis.chartType === 'pie' || analysis.chartType === 'donut') {
            return this.computeRadialLayout(
                chart,
                analysis,
                rules,
                modeConfig,
                baseFontSize,
                fontFamily,
                target,
                datasetColors,
                marginsResult
            );
        }

        // FASE TREEMAP: Compute Treemap specific geometry
        if (analysis.chartType === 'treemap') {
            return this.computeTreemapLayout(
                chart,
                analysis,
                rules,
                modeConfig,
                baseFontSize,
                fontFamily,
                target,
                datasetColors,
                marginsResult
            );
        }

        let margins = {
            top: marginsResult.top,
            right: marginsResult.right,
            bottom: marginsResult.bottom,
            left: marginsResult.left
        };
        const wrappedLabels = marginsResult.wrappedLabels;

        // Step 5: Assess overflow risk and apply adjustments if needed (FASE 1.2)
        const overflowAssessment = this.assessOverflowRisk(margins, {
            width: analysis.availableSpace.width,
            height: analysis.availableSpace.height
        });

        let overflowRisk: ComputedLayout['overflowRisk'];
        if (overflowAssessment.hasRisk) {
            // Apply adjustments
            margins = { ...margins, ...overflowAssessment.adjustments };
            overflowRisk = {
                hasRisk: true,
                warnings: overflowAssessment.warnings,
                appliedAdjustments: true
            };
        }

        // Step 6: Calculate plot zone
        const plotZone: Zone = {
            x: margins.left,
            y: margins.top,
            width: analysis.availableSpace.width - margins.left - margins.right,
            height: analysis.availableSpace.height - margins.top - margins.bottom
        };

        // Step 7: Calculate legend zone (if needed) - FASE 1.4: All positions
        let legendZone: Zone | null = null;
        if (analysis.layoutRequirements.needsLegend) {
            const legendPosition = analysis.layoutRequirements.userLegendPosition || rules.legendPosition;

            const legendDims = this.calculateLegendDimensions(
                datasets,
                legendPosition,
                baseFontSize,
                fontFamily,
                analysis.mode,
                analysis.availableSpace.width // Pass container width
            );

            // LOD Check: If Legend Only mode (Small), forbid legend from being hidden unless explicit?
            // Actually, if LOD is small, we force legend ON because we hide labels.
            // But we handle this in radial layout or here? 
            // In Radial layout we decide labels. Here we reserve space.
            // If LOD says "Labels Hidden, Legend Required", we must ensure space.
            // Let's deduce LOD here quickly or defer?
            // Safer to do standard calculation, and Radial Layout overrides if needed.

            if (legendPosition === 'bottom') {
                legendZone = {
                    x: margins.left,
                    y: analysis.availableSpace.height - margins.bottom + 10,
                    width: plotZone.width,
                    height: legendDims.height
                };
            } else if (legendPosition === 'top') {
                legendZone = {
                    x: margins.left,
                    y: 10,
                    width: plotZone.width,
                    height: legendDims.height
                };
            } else if (legendPosition === 'left') {
                legendZone = {
                    x: 10,
                    y: margins.top,
                    width: legendDims.width,
                    height: plotZone.height
                };
            } else if (legendPosition === 'right') {
                legendZone = {
                    x: analysis.availableSpace.width - margins.right + 10,
                    y: margins.top,
                    width: legendDims.width,
                    height: plotZone.height
                };
            }
        }

        // Step 8: Vertical Fill Strategy (Sub-Project 1.2)
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

        // Step 9: Label Wrapping Intelligence (FASE 1.3)
        const chartLabels = chart.data.labels || [];
        const fontWeight = '400'; // Default font weight for labels

        const labelWrapInfo = this.calculateLabelWrapThreshold(
            margins.left,
            baseFontSize,
            fontFamily,
            fontWeight
        );

        // FASE 4.3: Smart Sorting
        const autoSort = chart.style?.infographicConfig?.autoSort;
        let sortedIndices: number[] | undefined;

        if (autoSort && analysis.chartType === 'bar') {
            // Sort by value descending
            // Handle multi-dataset? For now, sum of stack or first dataset?
            // Usually sort by primary metric (dataset 0).
            const sortData = datasets[0]?.data || [];

            // Create array of [value, index]
            const paired = sortData.map((val, idx) => ({ val, idx }));

            // Sort
            paired.sort((a, b) => b.val - a.val); // Descending

            // Extract indices
            sortedIndices = paired.map(p => p.idx);
        }

        const estimatedLabelLines = chartLabels.length > 0

            ? Math.max(...chartLabels.map(l => this.estimateWrappedLines(l, labelWrapInfo.thresholdChars)))
            : 1;

        // FASE 4.1: Smart Positioning (Anchor Point)
        // We need to determine if values should be inside or outside based on bar thickness (height in this case) and length
        // Wait, for BarChart (horizontal), 'barThickness' returned here is actually the HEIGHT of the bar.
        // The WIDTH is variable per data point.
        // Smart Positioning check needs to happen per-data point in the component, OR we provide a global policy?
        // The roadmap says: "Implement logic: barWidth > labelWidth + 20px -> inside".
        // Since barWidth varies per value, we can't fully decide here for ALL bars unless we check the MINIMUM bar width?
        // Or we pass a policy: "If it fits, placing inside".

        // Actually, the Component renders per data point.
        // But the layout engine could analyze the "Worst case" (smallest bar)? No, smallest bar is 0.
        // Typically "Smart Positioning" means per-bar decision.
        // So we should expose the *Logic/Helper* or pre-calculate it?
        // The current BarChart logic does this decision at render time.
        // Engine should provide the *capability*.

        // Let's provide a 'preferredPositioning' policy.
        // But Phase 4 tasks say: "Update SmartLayoutEngine.ts to calculate positioning per bar".
        // NOTE: Engine computes GLOBAL layout (margins, zones). It doesn't output an array of positions for every data point (yet).
        // Doing so would make the output huge.
        // Compromise: We compute the *Thresholds* or provide the Colors for the component to decide.
        // BUT, task 4.2 says: "Engine calculates textColor".
        // If positioning is per-bar, textColor is also per-bar.
        // If we want "inside" for some and "outside" for others, the component needs to know *what color* to use for inside/outside.
        // ColorService gives that.

        // Let's pass the resolved `datasetColors` so component handles the rest for now?
        // Or better: Pass the `colors` array.

        // What about `valuePositioning`? 
        // We can pass 'smart' as a directive? Or defaults.
        // Let's stick to passing the resolved colors and letting component call ColorService for per-bar checks if needed,
        // OR (better architecture): Component is DUMB.
        // If Component is dumb, Engine should have simulated the layout.
        // But Engine doesn't iterate over every data point value currently in `computeLayout`.
        // `analyzeChart` iterates to find max/min.

        // DECISION: For Phase 4.1, we will enable "Smart Positioning" by passing the resolved colors
        // and a "smart" flag, but the actual per-bar geometry check must happen where the geometry is known (Component or a detailed Engine step).
        // Since we want to keep Engine simplified for now, we pass the Colors.

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
                barThickness,
                labelWrapThreshold: labelWrapInfo.thresholdChars,
                labelWrapThresholdPx: labelWrapInfo.thresholdPx,
                estimatedLabelLines,
                wrappedLabels,  // Smart wrapped labels with orphan prevention
                isStacked: marginsResult.isStacked, // Pass to component
                datasetColors,  // FASE 4.2: Pass resolved colors to component
                valuePositioning: 'auto', // FASE 4.1: Enable smart positioning logic in component

                sortedIndices  // FASE 4.3: Pass sorted order
            },

            overflowRisk
        };

    }

    /**
     * Helper: Calculate exact legend dimensions for all positions
     * Universal Legend Solver (FASE 1.2)
     */
    public static calculateLegendDimensions(
        datasets: Array<{ label?: string }>,
        legendPosition: 'top' | 'bottom' | 'left' | 'right' | 'none',
        baseFontSize: number,
        fontFamily: string,
        mode: 'classic' | 'infographic',
        containerWidth?: number // FASE 1.4: Dynamic Width Support
    ): { width: number; height: number } {
        if (legendPosition === 'none' || datasets.length === 0) {
            return { width: 0, height: 0 };
        }

        const itemFontSize = baseFontSize * LEGEND_FONT_SIZE_RATIO;
        const fontWeight = mode === 'infographic' ? '600' : '500';

        // Measure all legend item widths
        const itemWidths = datasets.map((ds, idx) => {
            const text = ds.label || `Série ${idx + 1}`;
            const textWidth = textMeasurementService.measureTextWidth({
                text,
                fontSize: itemFontSize,
                fontFamily,
                fontWeight
            });
            return LEGEND_ICON_SIZE + LEGEND_ICON_GAP + textWidth;
        });

        const maxItemWidth = Math.max(...itemWidths, 0);
        const totalItemWidth = itemWidths.reduce((sum, w) => sum + w, 0);

        if (legendPosition === 'top' || legendPosition === 'bottom') {
            // Horizontal layout: items in a row (or wrapped)
            // Use actual container width or fallback to 600, but ensuring it's not too small
            const availableWidth = Math.max(containerWidth || 600, 100);

            // Accurate wrapping calculation
            let rows = 1;
            let currentLineWidth = 0;

            // Iterate items to calculate real wrapping based on accumulated width
            for (let i = 0; i < itemWidths.length; i++) {
                const itemW = itemWidths[i] + LEGEND_ITEM_PADDING;
                if (currentLineWidth + itemW > availableWidth) {
                    rows++;
                    currentLineWidth = itemW;
                } else {
                    currentLineWidth += itemW;
                }
            }

            return {
                width: Math.min(totalItemWidth + (datasets.length * LEGEND_ITEM_PADDING), availableWidth),
                height: (rows * itemFontSize * 1.5) + ((rows - 1) * LEGEND_VERTICAL_GAP) + 12 // Increased line-height multiplier 1.2 -> 1.5 for breathing room
            };
        } else {
            // Vertical layout (left/right): items stacked
            return {
                width: maxItemWidth + 16,
                height: (datasets.length * itemFontSize * 1.2) + ((datasets.length - 1) * LEGEND_VERTICAL_GAP) + 12
            };
        }
    }

    /**
     * Helper: Detect overflow risk and suggest adjustments
     * FASE 1.2: Overflow Risk Detection
     */
    private static assessOverflowRisk(
        margins: { top: number; right: number; bottom: number; left: number },
        containerSize: { width: number; height: number }
    ): { hasRisk: boolean; warnings: string[]; adjustments: Partial<typeof margins> } {
        const warnings: string[] = [];
        const adjustments: Partial<typeof margins> = {};

        // Check if plot area is too small
        const plotWidth = containerSize.width - margins.left - margins.right;
        const plotHeight = containerSize.height - margins.top - margins.bottom;

        const minPlotWidth = containerSize.width * MIN_PLOT_WIDTH_RATIO; // 0.4
        const minPlotHeight = containerSize.height * 0.3;

        if (plotWidth < minPlotWidth) {
            warnings.push('Left/right margins too large, plot area < 40% of width');
            const reduction = (minPlotWidth - plotWidth) / 2;
            adjustments.left = Math.max(20, margins.left - reduction);
            adjustments.right = Math.max(20, margins.right - reduction);
        }

        if (plotHeight < minPlotHeight) {
            warnings.push('Top/bottom margins too large, plot area < 30% of height');
            const reduction = (minPlotHeight - plotHeight) / 2;
            adjustments.top = Math.max(10, margins.top - reduction);
            adjustments.bottom = Math.max(10, margins.bottom - reduction);
        }

        return {
            hasRisk: warnings.length > 0,
            warnings,
            adjustments
        };
    }

    /**
     * Helper: Calculate dynamic margins based on content
     * Enhanced for FASE 1.2: TOP margin, export buffer, Universal Legend Solver
     * Enhanced for FASE 1.3: Wrapped label width calculation
     * Enhanced for Smart Label Wrapping: Returns wrapped labels with orphan prevention
     */
    private static computeDynamicMargins(
        analysis: ChartAnalysis,
        rules: LayoutRules,
        mode: ModeModifiers,
        datasets: Array<{ label?: string }>,
        labels: string[],
        baseFontSize: number,
        fontFamily: string,
        target: 'screen' | 'pdf',
        layoutRequirements: ChartAnalysis['layoutRequirements'],
        dataComplexity: ChartAnalysis['dataComplexity']
    ): { top: number; right: number; bottom: number; left: number; wrappedLabels: string[][]; isStacked: boolean } {
        // Base margins
        const isRadial = analysis.chartType === 'pie' || analysis.chartType === 'donut';
        let marginLeft = isRadial ? 20 : 40;
        let marginRight = isRadial ? 20 : 40;
        let marginTop = 20;
        let marginBottom = 20;
        let wrappedLabels: string[][] = [];
        let isStacked = false;

        // Check for Stacked Layout (BarChart only)
        if (analysis.chartType === 'bar') {
            const fontScale = getScaledFont(baseFontSize, 'pt', 'medium'); // Estimate
            const charWidth = fontScale * 0.48;
            const maxLabelLength = dataComplexity.maxLabelWidthPx / charWidth; // approximate chars? No, use pixel width logic

            // Replicate BarChart logic: 
            // isInfographic || maxLabelLength > 15 || (maxLabelWidth > width * 0.25)
            const isInfographic = mode.marginMultiplier > 1; // heuristic for infographic mode if not explicit passed
            // Better: check mode
            const isInfographicMode = analysis.mode === 'infographic';

            // We need max label CHAR length and pixel width
            // We have maxLabelWidthPx. We need max char length? SmartLabelWrapper has analyzeLabels.
            // Let's rely on pixel width for now or re-measure chars if needed.
            // Actually, dataComplexity doesn't have maxLabelLengthChars.
            // But we have `labels`.
            const maxLabelChars = labels.reduce((max, l) => Math.max(max, l.length), 0);

            const width = analysis.availableSpace.width;

            if (isInfographicMode || maxLabelChars > 15 || (maxLabelChars * charWidth > width * 0.25)) {
                isStacked = true;
            }
        }

        // RIGHT: Based on value width (calculate first)
        if (rules.marginPriority.includes('right')) {
            // Add padding for "delta" or badges if needed, but start with the raw number width
            // FASE 4.6: Expanded safety buffers (40px instead of 32px) for large infographic numbers
            const isInfographicMode = analysis.mode === 'infographic';
            const safetyGap = isInfographicMode ? 40 : 16;
            marginRight = Math.max(40, dataComplexity.maxValueWidthPx + safetyGap);
        }

        // LEFT: Match right margin for symmetry OR use minimal for Stacked
        if (rules.marginPriority.includes('left')) {
            if (isStacked) {
                // Stacked Layout: Labels are on top, so left margin is just padding
                // But we still need to calculate wrapped labels for the FULL WIDTH

                // FASE 4.5: Proper Metric Passing
                const isInfographic = analysis.mode === 'infographic';
                const effectiveFontWeight = isInfographic ? '700' : '400';
                const letterSpacing = isInfographic ? 0.08 : 0;
                const effectiveFontSize = getScaledFont(
                    baseFontSize,
                    'pt', // assume default or from gridConfig if available (but margins uses baseFontSize arg)
                    'medium',
                    isInfographic
                ) * (isInfographic ? 0.85 : 1);

                const smartResult = SmartLabelWrapper.calculateSmartMargin(
                    labels,
                    analysis.availableSpace.width,
                    effectiveFontSize,
                    fontFamily,
                    effectiveFontWeight,
                    target,
                    analysis.chartType,
                    true, // isStacked = true
                    letterSpacing
                );

                wrappedLabels = smartResult.wrappedLabels;

                // For stacked, margin left is minimal (just symmetry or padding)
                // BarChart uses padding large/0. Engine uses base margins.
                // Let's set it to match right margin for symmetry or a fixed small value?
                // BarChart currently does: width - marginLeft - marginRight.
                // If we set huge marginLeft, the bars shrink.
                // In stacked mode, we want wide bars. So small margins.
                marginLeft = Math.max(40, marginRight); // Keep symmetry?
                // Actually, if we are stacked, we want more space for bars?
                // No, symmetry is good.
            } else {
                // Horizontal Layout: Labels in left margin
                // Horizontal Layout: Labels in left margin
                const isInfographic = analysis.mode === 'infographic';
                const effectiveFontWeight = isInfographic ? '700' : '400';
                const letterSpacing = isInfographic ? 0.08 : 0;
                const effectiveFontSize = getScaledFont(
                    baseFontSize,
                    'pt',
                    'medium',
                    isInfographic
                ) * (isInfographic ? 0.85 : 1);

                const smartResult = SmartLabelWrapper.calculateSmartMargin(
                    labels,
                    analysis.availableSpace.width,
                    effectiveFontSize,
                    fontFamily,
                    effectiveFontWeight,
                    target,
                    analysis.chartType,
                    false,
                    letterSpacing
                );

                wrappedLabels = smartResult.wrappedLabels;  // Keep intelligent wrapping
                marginLeft = smartResult.marginLeft; // Use measured margin, NOT marginRight
            }
        }

        // TOP: Title/Caption support (FASE 1.2)
        if (layoutRequirements.hasTitle && layoutRequirements.titleText) {
            const titleMetrics = textMeasurementService.measureDetailedMetrics({
                text: layoutRequirements.titleText,
                fontSize: baseFontSize * 1.2,
                fontFamily,
                fontWeight: '700'
            });
            marginTop = titleMetrics.height + 30; // title + padding
        } else {
            marginTop = 20 * mode.marginMultiplier;
        }

        // BOTTOM: Legend-based with Universal Legend Solver (FASE 1.2)
        if (layoutRequirements.needsLegend &&
            (layoutRequirements.userLegendPosition === 'bottom' || rules.legendPosition === 'bottom')) {
            const legendDims = this.calculateLegendDimensions(
                datasets,
                'bottom',
                baseFontSize,
                fontFamily,
                analysis.mode,
                analysis.availableSpace.width // Pass container width
            );
            marginBottom = legendDims.height + 10; // legend + gap
        } else {
            marginBottom = 30;
        }

        // Apply symmetry for Bar Charts (User Request)
        if (analysis.chartType === 'bar') {
            const sideMargin = Math.max(marginLeft, marginRight);
            marginLeft = sideMargin;
            marginRight = sideMargin;
        }

        // Apply export buffer for PDF (FASE 1.2)
        if (target === 'pdf') {
            marginTop += EXPORT_SAFETY_PADDING;
            marginRight += EXPORT_SAFETY_PADDING;
            marginBottom += EXPORT_SAFETY_PADDING;
            marginLeft += EXPORT_SAFETY_PADDING;
        }

        return {
            top: marginTop,
            right: marginRight,
            bottom: marginBottom,
            left: marginLeft,
            wrappedLabels,
            isStacked  // Pass decision to component
        };
    }

    /**
     * Helper: Calculate label wrap threshold based on reserved margin
     * FASE 1.3: Label Wrapping Intelligence
     */
    private static calculateLabelWrapThreshold(
        marginLeft: number,
        baseFontSize: number,
        fontFamily: string,
        fontWeight: string | number = '400'
    ): { thresholdPx: number; thresholdChars: number } {
        // Reserved space for labels = marginLeft - padding - gutter
        const availableWidth = marginLeft - LABEL_PADDING - LABEL_GUTTER;

        // Measure average character width using common characters
        const sampleText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const sampleWidth = textMeasurementService.measureTextWidth({
            text: sampleText,
            fontSize: baseFontSize,
            fontFamily,
            fontWeight: String(fontWeight)
        });

        const avgCharWidth = sampleWidth / sampleText.length;

        // Calculate character threshold
        const thresholdChars = Math.floor(availableWidth / avgCharWidth);

        return {
            thresholdPx: availableWidth,
            thresholdChars: Math.max(MIN_LABEL_WRAP_CHARS, thresholdChars)
        };
    }

    /**
     * Helper: Estimate how many lines a label will wrap to
     * FASE 1.3: Label Wrapping Intelligence
     */
    private static estimateWrappedLines(
        text: string,
        thresholdChars: number
    ): number {
        if (text.length <= thresholdChars) {
            return 1; // Fits in one line
        }

        // Split by words to account for word boundaries
        const words = text.split(/\s+/);
        let lines = 1;
        let currentLineLength = 0;

        for (const word of words) {
            const wordLength = word.length;

            if (currentLineLength + wordLength + 1 > thresholdChars) {
                // Word doesn't fit, start new line
                lines++;
                currentLineLength = wordLength;
            } else {
                // Word fits, add to current line
                currentLineLength += wordLength + 1; // +1 for space
            }
        }

        return Math.min(lines, MAX_LABEL_LINES); // Cap at max lines
    }

    /**
     * Helper: Calculate the maximum width of any wrapped line
     * FASE 1.3: Label Wrapping Intelligence
     */
    private static calculateMaxWrappedLineWidth(
        labels: string[],
        thresholdChars: number,
        baseFontSize: number,
        fontFamily: string,
        fontWeight: string = '400'
    ): number {
        if (labels.length === 0) return 0;

        let maxLineWidth = 0;

        for (const label of labels) {
            // Split label into wrapped lines
            const words = label.split(/\s+/);
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;

                if (testLine.length <= thresholdChars) {
                    currentLine = testLine;
                } else {
                    // Measure current line before wrapping
                    if (currentLine) {
                        const lineWidth = textMeasurementService.measureTextWidth({
                            text: currentLine,
                            fontSize: baseFontSize,
                            fontFamily,
                            fontWeight
                        });
                        maxLineWidth = Math.max(maxLineWidth, lineWidth);
                    }
                    currentLine = word;
                }
            }

            // Measure last line
            if (currentLine) {
                const lineWidth = textMeasurementService.measureTextWidth({
                    text: currentLine,
                    fontSize: baseFontSize,
                    fontFamily,
                    fontWeight
                });
                maxLineWidth = Math.max(maxLineWidth, lineWidth);
            }
        }

        return maxLineWidth;
    }

    /**
     * Helper: Calculate vertical space needed for wrapped labels
     * FASE 1.3: Label Wrapping Intelligence
     */
    private static calculateLabelVerticalSpace(
        labels: string[],
        thresholdChars: number,
        baseFontSize: number
    ): number {
        if (labels.length === 0) return 0;

        // Find max lines needed across all labels
        const maxLines = Math.max(
            ...labels.map(label => this.estimateWrappedLines(label, thresholdChars))
        );

        const lineHeight = baseFontSize * LABEL_LINE_HEIGHT_RATIO;
        const verticalPadding = 4;

        return (maxLines * lineHeight) + verticalPadding;
    }

    /**
     * Specialized: Compute Radial Layout (Pie, Donut)
     * Implementation of Sub-Project 3: Circular Family
     */
    private static computeRadialLayout(
        chart: { type: string; data: ChartData; style?: ChartStyle },
        analysis: ChartAnalysis,
        rules: LayoutRules,
        mode: ModeModifiers,
        baseFontSize: number,
        fontFamily: string,
        target: 'screen' | 'pdf',
        datasetColors: string[],
        marginsResult: { top: number; right: number; bottom: number; left: number }
    ): ComputedLayout {
        const width = analysis.availableSpace.width;
        const height = analysis.availableSpace.height;

        // FASE 5.1: Level of Detail (LOD) System
        const sizeDim = Math.min(width, height);
        let lod: 'tiny' | 'small' | 'normal' | 'detailed' = 'normal';

        if (sizeDim < 150) lod = 'tiny';
        else if (sizeDim < 300) lod = 'small';

        // Override LOD if "Show All Labels" is requested
        const forcedShowAll = chart.style?.infographicConfig?.showAllLabels;
        if (forcedShowAll) {
            lod = 'detailed'; // Force detailed
        }

        // FASE 5.2: Minimum Slice Angle Calculation (Visual Distortion)
        const dataset = chart.data.datasets?.[0];
        const rawValues = dataset?.data || [];
        const total = rawValues.reduce((a, b) => a + b, 0);

        // Define minimum degrees for visibility (increased for better "Projetos" clarity)
        const MIN_SLICE_DEGREES = 20;
        const MIN_SLICE_RAD = (MIN_SLICE_DEGREES * Math.PI) / 180;

        // 1. Identify "Tiny" slices
        const tinyIndices: number[] = [];
        let largeSum = 0;

        rawValues.forEach((val, i) => {
            const ratio = val / total;
            const degrees = ratio * 360;
            if (degrees < MIN_SLICE_DEGREES && val > 0) {
                tinyIndices.push(i);
            } else {
                largeSum += val;
            }
        });

        // 2. Distribute visual angles
        const reservedDegrees = tinyIndices.length * MIN_SLICE_DEGREES;
        const remainingDegrees = 360 - reservedDegrees;

        // Helper to get visual angle for index
        const getVisualAngle = (index: number): number => {
            if (tinyIndices.length === 0 || remainingDegrees <= 0) {
                return (rawValues[index] / total) * 2 * Math.PI;
            }
            if (tinyIndices.includes(index)) {
                return MIN_SLICE_RAD;
            }
            // Scale down large slices
            // Re-normalize: (val / largeSum) * remainingDegrees
            return (rawValues[index] / largeSum) * (remainingDegrees * Math.PI / 180);
        };

        const maxValue = Math.max(...rawValues);
        const labels = chart.data.labels || [];

        // Constants for Radial Layout
        // Constants for Radial Layout
        // Dynamic Constraints based on container
        const DYNAMIC_MAX_LABEL_WIDTH = Math.max(120, width * 0.28); // Dynamic wrap width (approx 28% of container)
        const SPIDER_LEG_X_EXTENSION = 40;
        const MIN_VERTICAL_GAP = 12;
        const MIN_RADIAL_THICKNESS_RATIO = 0.22; // Floor: 22% of radius must be filled even for smallest slices

        // 1. Pre-analysis: Wrap text and determine space needs
        let maxLabelWidthNeeded = 0;
        let needsExternal = rawValues.length > 8;

        // Columnar Layout Request
        const labelLayout = chart.style?.infographicConfig?.labelLayout || 'radial'; // 'radial', 'column-left', 'column-right'
        const isColumnar = labelLayout === 'column-left' || labelLayout === 'column-right' || labelLayout === 'balanced'; // Added balanced
        if (isColumnar) needsExternal = true; // Columns imply external labels

        if (lod === 'tiny') {
            needsExternal = false; // No labels in tiny mode
        }

        // Store pre-calculated metrics to avoid re-measuring
        const measuredLabels = rawValues.map((val, i) => {
            const labelText = labels[i] || '';

            // Fonts
            const valueFontSize = getScaledFont(baseFontSize, 'pt', 'tiny', true);
            const categoryFontSize = getScaledFont(baseFontSize, 'pt', 'tiny', false);

            // Wrap Category Label
            // We use a simplified wrapping logic here or fallback to splitting by words
            // Since we don't have a robust helper exposed, we simulate it:
            const words = labelText.toUpperCase().split(/\s+/);
            let currentLine = words[0] || '';
            const showLabelsCategory = chart.style?.infographicConfig?.showLabelsCategory !== false;

            const wrappedLines: string[] = [];
            let maxCategoryWidth = 0;
            let categoryHeight = 0;

            if (showLabelsCategory) {
                for (let w = 1; w < words.length; w++) {
                    const testLine = currentLine + ' ' + words[w];
                    const testWidth = textMeasurementService.measureTextWidth({
                        text: testLine,
                        fontSize: categoryFontSize,
                        fontFamily,
                        fontWeight: '400'
                    });
                    if (testWidth <= DYNAMIC_MAX_LABEL_WIDTH) {
                        currentLine = testLine;
                    } else {
                        wrappedLines.push(currentLine);
                        currentLine = words[w];
                    }
                }
                wrappedLines.push(currentLine);

                // Measure Dimensions
                const categoryWidths = wrappedLines.map(line => textMeasurementService.measureTextWidth({
                    text: line, fontSize: categoryFontSize, fontFamily, fontWeight: '400'
                }));
                maxCategoryWidth = Math.max(...categoryWidths, 0);
                categoryHeight = wrappedLines.length * (categoryFontSize * 1.2);
            }

            // Measure Value (FASE 4: Formatting integration)
            const numberFormat = chart.style?.numberFormat;
            const percentageValue = (val / total) * 100;
            const percentageText = `${percentageValue.toFixed(1)}%`;

            // For Pie/Donut labels, we use the formatted value if it's NOT percentage, 
            // or the percentage if it IS percentage.
            const textToMeasure = (numberFormat?.type === 'currency' || numberFormat?.type === 'number')
                ? smartFormatChartValue(val, numberFormat)
                : percentageText;

            const valueMetrics = textMeasurementService.measureDetailedMetrics({
                text: textToMeasure,
                fontSize: valueFontSize,
                fontFamily,
                fontWeight: '900'
            });

            // Total Block Dimensions
            const totalWidth = Math.max(maxCategoryWidth, valueMetrics.width);
            // Height: (Category Lines * LineHeight) + Value Height + Padding
            const totalHeight = categoryHeight + valueMetrics.height + (showLabelsCategory ? 4 : 0);

            return {
                wrappedLines,
                totalWidth,
                totalHeight,
                formattedValue: textToMeasure,
                valueMetrics,
                maxCategoryWidth,
                categoryHeight
            };
        });
        // FASE 10: Inherit margins from computeDynamicMargins (handles Legend space)
        const margins = {
            top: marginsResult.top,
            bottom: marginsResult.bottom,
            left: marginsResult.left,
            right: marginsResult.right
        };

        // Force larger margins if using columnar layout to accommodate text columns
        const hasColumnarLayout = (chart.style?.infographicConfig?.labelLayout === 'column-left' ||
            chart.style?.infographicConfig?.labelLayout === 'column-right' ||
            chart.style?.infographicConfig?.labelLayout === 'balanced');

        let safeDynamicMargin = 0;
        if (hasColumnarLayout) {
            let maxLabelWidth = 0;
            measuredLabels.forEach(m => {
                if (m.totalWidth > maxLabelWidth) maxLabelWidth = m.totalWidth;
            });

            // Required space for a column
            const requiredSide = maxLabelWidth + 50;
            const maxAllowedSide = width * 0.45; // Increased cap for wide text
            safeDynamicMargin = Math.max(70, Math.min(requiredSide, maxAllowedSide));

            if (labelLayout === 'column-left') {
                margins.left = safeDynamicMargin;
                margins.right = 30;
            } else if (labelLayout === 'column-right') {
                margins.right = safeDynamicMargin;
                margins.left = 30;
            } else {
                margins.left = safeDynamicMargin;
                margins.right = safeDynamicMargin;
            }
        }

        // FASE 10: Margin Collapse (Reclaim space if no external labels needed)
        if (!needsExternal && !lod.includes('tiny')) {
            // If we don't need columns, check if we can shrink margins to defaults
            // but keep the space reserved for the legend.
            const minPadding = 20;
            margins.left = Math.max(margins.left - safeDynamicMargin + minPadding, margins.left);
            margins.right = Math.max(margins.right - safeDynamicMargin + minPadding, margins.right);

            // If labels are internal and we were in columnar mode, we might have pushed 
            // the chart too much. Let's force symmetry if it wasn't explicit.
            if (!isColumnar) {
                const sideMax = Math.max(margins.left, margins.right);
                margins.left = sideMax;
                margins.right = sideMax;
            }
        }

        // FASE 9: Re-calculate available space using FINAL dynamic margins
        const availableW = width;
        const availableH = height;
        const testPlotSize = Math.min(
            availableW - (margins.left + margins.right),
            availableH - (margins.top + margins.bottom)
        );

        const testOuterRadius = testPlotSize / 2;
        const testInnerRadius = chart.type === 'donut' ? testOuterRadius * 0.75 : 0;

        rawValues.forEach((val, i) => {
            const sliceAngle = getVisualAngle(i);
            const sliceWidthAtCentroid = (testOuterRadius + testInnerRadius) / 2 * sliceAngle;
            const measure = measuredLabels[i];

            let fitsInternal = false;

            if (lod === 'tiny') {
                fitsInternal = true;
            } else if (isColumnar) {
                fitsInternal = sliceAngle >= (60 * Math.PI / 180) &&
                    sliceWidthAtCentroid > measure.totalWidth + 40 &&
                    (testOuterRadius - testInnerRadius) > measure.totalHeight + 25;
            } else {
                fitsInternal = sliceAngle >= (30 * Math.PI / 180) &&
                    sliceWidthAtCentroid > measure.totalWidth + 35 &&
                    (testOuterRadius - testInnerRadius) > measure.totalHeight + 20;
            }

            if ((!fitsInternal || needsExternal) && lod !== 'tiny') {
                needsExternal = true;
                maxLabelWidthNeeded = Math.max(maxLabelWidthNeeded, measure.totalWidth + SPIDER_LEG_X_EXTENSION + 20);
            }
        });

        // 3. Define Plot Zone
        const plotZone: Zone = {
            x: margins.left + (availableW - (margins.left + margins.right) - testPlotSize) / 2,
            y: margins.top + (availableH - (margins.top + margins.bottom) - testPlotSize) / 2,
            width: testPlotSize,
            height: testPlotSize
        };

        // Re-center or shift plot zone based on layout strategy if width > height
        if (availableW > availableH) {
            if (labelLayout === 'column-right') {
                plotZone.x = margins.left;
            } else if (labelLayout === 'column-left') {
                plotZone.x = width - margins.right - testPlotSize;
            }
        }

        // FASE 10: Accurate Legend Zone Calculation
        let legendZone: Zone | null = null;
        if (analysis.layoutRequirements.needsLegend) {
            const legendPosition = analysis.layoutRequirements.userLegendPosition || rules.legendPosition;
            const legendDims = this.calculateLegendDimensions(
                chart.data.datasets || [],
                legendPosition,
                baseFontSize,
                fontFamily,
                analysis.mode,
                width
            );

            if (legendPosition === 'bottom') {
                legendZone = {
                    x: margins.left,
                    y: height - margins.bottom + 10,
                    width: plotZone.width,
                    height: legendDims.height
                };
            } else if (legendPosition === 'top') {
                legendZone = {
                    x: margins.left,
                    y: 10,
                    width: plotZone.width,
                    height: legendDims.height
                };
            } else if (legendPosition === 'left') {
                legendZone = {
                    x: 10,
                    y: margins.top,
                    width: legendDims.width,
                    height: plotZone.height
                };
            } else if (legendPosition === 'right') {
                legendZone = {
                    x: width - margins.right + 10,
                    y: margins.top,
                    width: legendDims.width,
                    height: plotZone.height
                };
            }
        }

        const centerX = plotZone.x + plotZone.width / 2;
        const centerY = plotZone.y + plotZone.height / 2;
        const outerRadius = plotZone.width / 2;

        // FASE 7: Thickness Integrity Floor
        const baseThickness = outerRadius * (analysis.mode === 'infographic' ? 0.35 : 0.4);
        const minThickness = outerRadius * MIN_RADIAL_THICKNESS_RATIO;
        const innerRadius = chart.type === 'donut' ? (outerRadius - baseThickness) : 0;

        const labelPlacements: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        const spiderLegs: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        const slices: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        const innerRadii: number[] = [];
        let startAngle = 0;

        // Collect proposed external placements for relaxation
        const rightSideLabels: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        const leftSideLabels: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

        rawValues.forEach((val, i) => {
            const sliceAngle = getVisualAngle(i);
            const labelAngle = startAngle + sliceAngle / 2;
            const measure = measuredLabels[i];

            // Variable Thickness with Integrity Floor
            let currentInnerRadius = innerRadius;
            if (analysis.mode === 'infographic' && chart.type === 'donut') {
                const weight = val / maxValue;
                const dynamicThickness = Math.max(minThickness, weight * baseThickness);
                currentInnerRadius = outerRadius - dynamicThickness;
            }
            innerRadii.push(currentInnerRadius);

            const endAngle = startAngle + sliceAngle;
            const midAngle = startAngle + sliceAngle / 2;

            // Store Visual Geometry
            slices.push({
                startAngle,
                endAngle,
                midAngle,
                innerRadius: currentInnerRadius,
                outerRadius,
                color: datasetColors[i % datasetColors.length],
                value: val,
                percent: (val / total) * 100,
                originalIndex: i
            });

            // Re-check logic for this specific slice
            const measureCheck = measuredLabels[i];
            const sliceWidthAtCentroid = (outerRadius + currentInnerRadius) / 2 * sliceAngle;
            const fitsWidth = sliceWidthAtCentroid > measureCheck.totalWidth + 35;
            const fitsDepth = (outerRadius - currentInnerRadius) > measureCheck.totalHeight + 20;
            const isNarrow = sliceAngle < (30 * Math.PI / 180);
            const isCrowded = rawValues.length > 8;

            let strategy: 'internal' | 'external' | 'hidden' = 'internal';

            if (lod === 'tiny') {
                strategy = 'hidden';
            } else if (lod === 'small' && !forcedShowAll) {
                strategy = 'hidden'; // Rely on Legend/Tooltip
            } else if (fitsWidth && fitsDepth) {
                // If it fits inside, stay inside regardless of columnar layout (Hybrid Strategy)
                strategy = 'internal';
            } else if (isColumnar) {
                // Doesn't fit inside, and we want columns -> external
                strategy = 'external';
            } else if (isNarrow || isCrowded || !fitsWidth || !fitsDepth) {
                strategy = 'external';
            }

            // Internal Placement
            const internalR = (outerRadius + currentInnerRadius) / 2;
            const ix = internalR * Math.cos(labelAngle - Math.PI / 2);
            const iy = internalR * Math.sin(labelAngle - Math.PI / 2);

            // External Placement (Preliminary)
            const isRightSide = (labelAngle % (2 * Math.PI)) < Math.PI;
            let textAnchor = isRightSide ? 'start' : 'end';
            let spiderLabelX = isRightSide ? outerRadius + SPIDER_LEG_X_EXTENSION : -outerRadius - SPIDER_LEG_X_EXTENSION;
            const spiderLabelY = (outerRadius + 20) * Math.sin(labelAngle - Math.PI / 2);

            // Columnar Overrides
            if (strategy === 'external') {
                if (labelLayout === 'column-right') {
                    spiderLabelX = outerRadius + SPIDER_LEG_X_EXTENSION;
                    textAnchor = 'start';
                } else if (labelLayout === 'column-left') {
                    spiderLabelX = -outerRadius - SPIDER_LEG_X_EXTENSION;
                    textAnchor = 'end';
                }
            }

            // Store placement object
            const placement = {
                index: i,
                x: strategy === 'internal' ? ix : spiderLabelX,
                y: strategy === 'internal' ? iy : spiderLabelY,
                textAnchor: strategy === 'internal' ? 'middle' : textAnchor,
                strategy,
                formattedValue: measure.formattedValue,
                color: ColorService.getBestContrastColor(datasetColors[i % datasetColors.length]),
                wrappedLines: measure.wrappedLines, // Respect toggle (don't fallback if empty)
                height: measure.totalHeight, // for collision
                labelAngle,
                isRightSide,
                sliceIndex: i,
                originalY: spiderLabelY
            };

            labelPlacements.push(placement);

            // External Placement Logic
            if (strategy === 'external') {
                // Determine Side based on layout preference
                let side: 'left' | 'right' = 'right';

                if (labelLayout === 'column-left') side = 'left';
                else if (labelLayout === 'column-right') side = 'right';
                else if (labelLayout === 'balanced') {
                    // Split by angle: Left (PI to 2PI), Right (0 to PI) assuming 12 o'clock start
                    const mid = startAngle + sliceAngle / 2;
                    const geometricAngle = mid - Math.PI / 2;
                    side = Math.cos(geometricAngle) >= 0 ? 'right' : 'left';
                } else {
                    // Classic Radial External
                    // ... (omitted for columnar block)
                    // If we are here, isColumnar or crowded.
                    // If columnar, we should stick to columns.
                    // If radial-crowded, do we use columns? No, radial explosion.
                    // But this block is "External Placement Logic".
                }

                if (isColumnar) {
                    // Center-Relative Y-coordinate
                    const yPos = outerRadius * Math.sin(labelAngle - Math.PI / 2);

                    if (side === 'left') {
                        leftSideLabels.push({
                            originalY: yPos,
                            y: yPos,
                            sliceIndex: i,
                            measure,
                            color: datasetColors[i % datasetColors.length],
                            textAnchor: 'end', // Left side: end at margin, grow towards center
                            xTarget: margins.left - centerX + 50, // Added safety offset from center
                            totalHeight: measure.totalHeight
                        });
                    } else {
                        rightSideLabels.push({
                            originalY: yPos,
                            y: yPos,
                            sliceIndex: i,
                            measure,
                            color: datasetColors[i % datasetColors.length],
                            textAnchor: 'start', // Right side: start at margin, grow towards center
                            xTarget: (width - margins.right) - centerX - 50, // Added safety offset
                            totalHeight: measure.totalHeight
                        });
                    }
                    // Skip strict radial calculation for columnar
                    startAngle += sliceAngle;
                    return;
                }
            }
            startAngle += sliceAngle;
        });

        // 4. Collision Resolution (Spider Leg Relaxation)
        const relaxLabels = (items: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (items.length <= 1) return;
            // Sort by originalY (top to bottom) to ensure no legs ever cross
            items.sort((a, b) => a.originalY - b.originalY);

            const minY = margins.top - centerY + 10;
            const maxY = (height - margins.bottom) - centerY - 10;

            // Forward pass (push down)
            if (items[0].y < minY) items[0].y = minY;

            for (let i = 1; i < items.length; i++) {
                const prev = items[i - 1];
                const curr = items[i];
                const requiredGap = (prev.totalHeight / 2) + (curr.totalHeight / 2) + MIN_VERTICAL_GAP;

                if (curr.y - prev.y < requiredGap) {
                    curr.y = prev.y + requiredGap;
                }
            }

            // Backward pass (push up to avoid bottom clipping)
            let lastItem = items[items.length - 1];
            if (lastItem.y + (lastItem.totalHeight / 2) > maxY) {
                lastItem.y = maxY - (lastItem.totalHeight / 2);
                for (let i = items.length - 2; i >= 0; i--) {
                    const next = items[i + 1];
                    const curr = items[i];
                    const requiredGap = (curr.totalHeight / 2) + (next.totalHeight / 2) + MIN_VERTICAL_GAP;
                    if (next.y - curr.y < requiredGap) {
                        curr.y = next.y - requiredGap;
                    }
                }
                if (items[0].y < minY) items[0].y = minY;
            }
        };

        relaxLabels(rightSideLabels);
        relaxLabels(leftSideLabels);

        // Merge Back Columnar Labels into labelPlacements
        if (isColumnar) {
            [...leftSideLabels, ...rightSideLabels].forEach((p) => {
                // Find existing placement (the internal one we pushed earlier)
                const idx = labelPlacements.findIndex(lp => lp.sliceIndex === p.sliceIndex);
                if (idx !== -1) {
                    labelPlacements[idx] = {
                        ...labelPlacements[idx],
                        x: p.xTarget,
                        y: p.y,
                        textAnchor: p.textAnchor,
                        strategy: 'external'
                    };
                }
            });
        }

        // Update Spider Legs based on relaxed positions
        labelPlacements.forEach((p) => {
            if (p.strategy === 'external') {
                // Re-calculate leg points
                // Start: Radial at OuterRadius
                // Elbow: Radial at OuterRadius + 15
                // End: (p.x, p.y)
                // NOTE: p.x and p.y are relative to CenterX/CenterY in our math above?
                // Wait, spiderLabelX defined above: `outerRadius + 40`. This is relative to center.
                // DonutChart renders `g transform(centerX, centerY)`. So (0,0) is center.
                // So our math is correct relative to center.

                const lx = Math.cos(p.labelAngle - Math.PI / 2);
                const ly = Math.sin(p.labelAngle - Math.PI / 2);

                spiderLegs.push({
                    labelX: p.x,
                    labelY: p.y,
                    sliceIndex: p.sliceIndex,
                    textAnchor: p.textAnchor,
                    points: [
                        `${outerRadius * lx},${outerRadius * ly}`,
                        `${(outerRadius + 15) * lx},${(outerRadius + 15) * ly}`,
                        `${p.x},${p.y}`
                    ]
                });
            }
        });

        return {
            container: { width, height },
            zones: { plot: plotZone, legend: legendZone, xAxis: null, yAxis: null },
            margins,
            scaling: { factor: 1.0, appliedTo: [] },
            typeSpecific: {
                centerX,
                centerY,
                outerRadius,
                innerRadius,
                innerRadii,
                datasetColors,
                labelPlacements, // Contains the relaxed Y coordinates
                spiderLegs,
                slices,
                lod
            }
        };
    }

    /**
     * Phase 3: Treemap Layout Expansion
     * Implements Squarified Treemap Algorithm
     */
    private static computeTreemapLayout(
        chart: { type: string; data: ChartData; style?: ChartStyle },
        analysis: ChartAnalysis,
        rules: LayoutRules,
        mode: ModeModifiers,
        baseFontSize: number,
        fontFamily: string,
        target: 'screen' | 'pdf',
        datasetColors: string[],
        margins: { top: number; right: number; bottom: number; left: number }
    ): ComputedLayout {
        const { width, height } = analysis.availableSpace;
        const labels = chart.data.labels || [];
        const datasets = chart.data.datasets || [];
        const dataset = datasets[0];

        // 1. Calculate Plot Zone
        // FASE SPATIAL: Asymmetric padding. 
        // We typically need more space on the RIGHT for spider legs (minDist logic usually picks vertical or right edge).
        // Using 10px on the left and 70px on the right to optimize center space usage.
        const isInfographic = analysis.mode === 'infographic';
        const paddingL = isInfographic ? 10 : 5;
        const paddingR = isInfographic ? 75 : 10;

        const plotZone: Zone = {
            x: margins.left + paddingL,
            y: margins.top,
            width: width - margins.left - margins.right - paddingL - paddingR,
            height: height - margins.top - margins.bottom
        };

        // 2. Legend Zone
        let legendZone: Zone | null = null;
        if (analysis.layoutRequirements.needsLegend) {
            const legendPosition = analysis.layoutRequirements.userLegendPosition || rules.legendPosition;
            const legendDims = this.calculateLegendDimensions(datasets, legendPosition, baseFontSize, fontFamily, analysis.mode, width);

            if (legendPosition === 'bottom') {
                legendZone = {
                    x: margins.left,
                    y: height - margins.bottom + 10,
                    width: plotZone.width,
                    height: legendDims.height
                };
            }
        }

        // 3. Squarified Treemap Algorithm Implementation
        const rawData = dataset?.data || [];
        // Map data to objects with index to track original labels/colors
        const items = rawData.map((val, idx) => ({
            value: val,
            index: idx,
            label: labels[idx] || `Item ${idx + 1}`
        })).sort((a, b) => b.value - a.value);

        const totalValue = items.reduce((sum, item) => sum + item.value, 0);
        const rects: Array<{ x: number, y: number, width: number, height: number, value: number, index: number, label: string }> = [];

        if (totalValue > 0 && items.length > 0) {
            const scale = (plotZone.width * plotZone.height) / totalValue;

            // Let's use a simpler iterative squarify for easier index tracking
            let remainingRect = { x: plotZone.x, y: plotZone.y, w: plotZone.width, h: plotZone.height };
            let currentIndex = 0;

            while (currentIndex < items.length) {
                const row: number[] = [];
                const rowItems: any[] = [];
                let bestRatio = Infinity;

                while (currentIndex < items.length) {
                    const nextVal = items[currentIndex].value * scale;
                    const newRow = [...row, nextVal];
                    const newRatio = this.calculateMaxAspectRatio(newRow, Math.min(remainingRect.w, remainingRect.h));

                    if (newRatio <= bestRatio) {
                        row.push(nextVal);
                        rowItems.push(items[currentIndex]);
                        bestRatio = newRatio;
                        currentIndex++;
                    } else {
                        break;
                    }
                }

                // Finalize Row
                const rowValueSum = row.reduce((a, b) => a + b, 0);
                const isVertical = remainingRect.w >= remainingRect.h;
                const rowWidth = isVertical ? rowValueSum / remainingRect.h : remainingRect.w;
                const rowHeight = isVertical ? remainingRect.h : rowValueSum / remainingRect.w;

                let currentPos = isVertical ? remainingRect.y : remainingRect.x;
                for (let i = 0; i < row.length; i++) {
                    const itemArea = row[i];
                    const itemW = isVertical ? rowWidth : itemArea / rowHeight;
                    const itemH = isVertical ? itemArea / rowWidth : rowHeight;

                    rects.push({
                        x: isVertical ? remainingRect.x : currentPos,
                        y: isVertical ? currentPos : remainingRect.y,
                        width: itemW,
                        height: itemH,
                        value: rowItems[i].value,
                        index: rowItems[i].index,
                        label: rowItems[i].label
                    });

                    currentPos += isVertical ? itemH : itemW;
                }

                // Update remaining rectangle
                if (isVertical) {
                    remainingRect.x += rowWidth;
                    remainingRect.w -= rowWidth;
                } else {
                    remainingRect.y += rowHeight;
                    remainingRect.h -= rowHeight;
                }
            }
        }

        // 4. Labeling Strategy (Internal vs External)
        const treemapPositions = rects.map(rect => {
            const isInfographic = analysis.mode === 'infographic';
            const infographicConfig = chart.style?.infographicConfig || {};

            // Hero defaults to the largest value (items[0]) if not specified
            const heroValueIndex = infographicConfig.heroValueIndex !== undefined
                ? infographicConfig.heroValueIndex
                : items[0].index;

            const isHero = rect.index === heroValueIndex;

            // Define base variables for this rectangle
            const baseSize = getScaledFont(baseFontSize, 'pt', isHero ? 'medium' : 'small', isInfographic);
            const fontWeight = isInfographic ? '700' : '500';
            const percent = totalValue > 0 ? (rect.value / totalValue) * 100 : 0;

            // FASE HERO-FIT (Smart Internal Fit): Try progressively smaller sizes before ejecting
            // Multipliers to try: Hero defaults (4.5 -> 3 -> 2), Standard (1.3 -> 1)
            const multipliers = isHero
                ? (isInfographic ? [4.5, 3, 2.2, 1.5] : [1.5, 1.2, 1])
                : (isInfographic ? [1.3, 1.1, 1] : [1]);

            let finalMultiplier = multipliers[multipliers.length - 1];
            let strategy: 'internal' | 'external' | 'hidden' = 'hidden';
            let bestWrapResult = null;
            let finalFontSize = baseSize;

            for (const m of multipliers) {
                const fs = baseSize * m;
                // fontWeight is defined above

                const wrap = SmartLabelWrapper.calculateOptimalWrap(
                    rect.label,
                    rect.width - 10,
                    fs,
                    fontFamily,
                    fontWeight
                );

                const totalH = wrap.lineCount * fs * 1.2;
                const fits = wrap.requiredWidth <= rect.width - 10 && totalH <= rect.height - 10;

                if (fits) {
                    finalMultiplier = m;
                    finalFontSize = fs;
                    bestWrapResult = wrap;
                    strategy = 'internal';
                    break;
                }

                // Keep the last result as fallback (usually for external)
                if (!bestWrapResult) {
                    bestWrapResult = wrap;
                    finalFontSize = fs;
                }
            }

            // Force external if it didn't fit internally
            const showAllLabels = infographicConfig.showAllLabels === true;
            if (strategy !== 'internal') {
                if (isHero || showAllLabels || (rect.width > 25 && rect.height > 12)) {
                    strategy = 'external';
                    // Reset font size for external (standard editorial size)
                    // Hero External: 2.2, Standard External: 1.1
                    finalMultiplier = isHero ? 2.2 : 1.1;
                    finalFontSize = baseSize * finalMultiplier;

                    // RE-MEASURE for external column width (approx 80px)
                    // This ensures we have accurate height for the greedy limiter
                    bestWrapResult = SmartLabelWrapper.calculateOptimalWrap(
                        rect.label,
                        80,
                        finalFontSize,
                        fontFamily,
                        fontWeight
                    );
                }
            }

            let spiderLeg = undefined;
            if (strategy === 'external') {
                const cx = rect.x + rect.width / 2;
                const cy = rect.y + rect.height / 2;
                const distToLeft = cx - plotZone.x;
                const distToRight = (plotZone.x + plotZone.width) - cx;
                const distToTop = cy - plotZone.y;
                const distToBottom = (plotZone.y + plotZone.height) - cy;
                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

                let lx = cx, ly = cy, textAnchor: 'start' | 'end' | 'middle' = 'middle';
                if (minDist === distToLeft) { lx = plotZone.x - 40; ly = cy; textAnchor = 'end'; }
                else if (minDist === distToRight) { lx = plotZone.x + plotZone.width + 40; ly = cy; textAnchor = 'start'; }
                else if (minDist === distToTop) { lx = cx; ly = plotZone.y - 30; textAnchor = 'middle'; }
                else { lx = cx; ly = plotZone.y + plotZone.height + 30; textAnchor = 'middle'; }

                spiderLeg = {
                    labelX: lx,
                    labelY: ly,
                    points: [`${cx},${cy}`, `${lx},${ly}`],
                    textAnchor
                };
            }

            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                value: rect.value,
                originalIndex: rect.index,
                label: rect.label,
                color: datasetColors[rect.index % datasetColors.length],
                percent,
                strategy,
                spiderLeg,
                measure: {
                    wrappedLines: bestWrapResult ? bestWrapResult.lines : [rect.label],
                    totalWidth: bestWrapResult ? bestWrapResult.requiredWidth : 0,
                    totalHeight: bestWrapResult ? (bestWrapResult.lineCount * finalFontSize * 1.2) : 0
                },
                isHero,
                fontSize: finalFontSize, // Return computed font size
                occupancyHeight: undefined as number | undefined
            };
        });

        // 5. COLUMNAR EXTERNAL LABELS (Editorial Density Limiter - Greedy Height)
        // Measure accurate heights and accumulate until full. Quality > Quantity.
        const extPositions = treemapPositions.filter(p => p.strategy === 'external' && p.spiderLeg);
        if (extPositions.length > 0) {
            const targetX = plotZone.x + plotZone.width + 10;
            const availableHeight = plotZone.height;
            const gap = 5; // Padding between items

            // 1. Sort Candidates: Hero First, then Value Descending
            const candidates = [...extPositions].sort((a, b) => {
                if (a.isHero) return -1;
                if (b.isHero) return 1;
                return b.value - a.value;
            });

            // 2. Greedy Selection
            const visibleItems: typeof candidates = [];
            let usedHeight = 0;

            candidates.forEach(p => {
                // Height from re-measurement in map (or default)
                // Use a min-height of 20px to ensure touch/visual target
                const itemHeight = Math.max(20, p.measure?.totalHeight || 20);

                if (usedHeight + itemHeight <= availableHeight) {
                    visibleItems.push({ ...p, occupancyHeight: itemHeight });
                    usedHeight += itemHeight + gap;
                } else {
                    // Start hiding
                    p.strategy = 'hidden';
                    p.spiderLeg = undefined;
                }
            });

            // 3. Spatially Sort (Y) for clean lines
            visibleItems.sort((a, b) => a.y - b.y);

            // 4. Distribute Centered
            // Recalculate exact total occupancy (sum heights + gaps)
            const totalOccupancy = visibleItems.reduce((sum, p) => sum + (p.occupancyHeight || 0), 0) + (Math.max(0, visibleItems.length - 1) * gap);

            const chartCenterY = plotZone.y + plotZone.height / 2;
            let currentY = chartCenterY - (totalOccupancy / 2);

            // Clamp top
            if (currentY < plotZone.y) currentY = plotZone.y;

            visibleItems.forEach(p => {
                const height = p.occupancyHeight || 20;
                const ly = currentY + (height / 2); // Center text in visual slot

                if (p.spiderLeg) {
                    p.spiderLeg.labelX = targetX;
                    p.spiderLeg.labelY = ly;
                    p.spiderLeg.textAnchor = 'start';
                    (p.spiderLeg as any).scaleFactor = 1;

                    const cx = p.x + p.width / 2;
                    const cy = p.y + p.height / 2;

                    p.spiderLeg.points = [
                        `${cx},${cy}`,
                        `${targetX - 5},${cy}`, // Elbow
                        `${targetX},${ly}`
                    ];
                }
                currentY += height + gap;
            });
        }

        return {
            container: { width: analysis.availableSpace.width, height: analysis.availableSpace.height },
            zones: { plot: plotZone, legend: legendZone, xAxis: null, yAxis: null },
            margins,
            scaling: { factor: 1.0, appliedTo: [] },
            typeSpecific: {
                treemapPositions,
                datasetColors
            }
        };
    }

    private static calculateMaxAspectRatio(row: number[], width: number): number {
        if (row.length === 0) return Infinity;
        const sum = row.reduce((a, b) => a + b, 0);
        const s2 = sum * sum;
        const w2 = width * width;
        const rMax = Math.max(...row);
        const rMin = Math.min(...row);

        return Math.max((w2 * rMax) / s2, s2 / (w2 * rMin));
    }

    /**
     * Helper: Get mode-specific multipliers
     */
    private static getModeModifiers(mode: 'classic' | 'infographic'): ModeModifiers {
        return MODE_MULTIPLIERS[mode];
    }
}
