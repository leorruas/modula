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
        const isInfographic = style?.mode === 'infographic';
        const fontWeight = isInfographic ? '700' : '500';



        // Measure category label widths
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

        // Max value (ratio 1.0) gets the largest multiplier in Infographic mode
        const maxMult = isInfographic ? 2.0 : 1.0;
        const finalValueFontSize = effectiveFontSizePx * maxMult;

        const maxValStr = String(Math.round(maxValue));
        const maxValueWidthPx = textMeasurementService.measureTextWidth({
            text: maxValStr,
            fontSize: finalValueFontSize,
            fontFamily,
            fontWeight: isInfographic ? '900' : '600'
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
                datasetColors
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
                analysis.mode
            );

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
        mode: 'classic' | 'infographic'
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
            const containerWidth = 600; // Assume typical chart width
            const itemsPerRow = Math.max(1, Math.floor(containerWidth / (maxItemWidth + LEGEND_ITEM_PADDING)));
            const rows = Math.ceil(datasets.length / itemsPerRow);

            return {
                width: Math.min(totalItemWidth + (datasets.length * LEGEND_ITEM_PADDING), containerWidth),
                height: (rows * itemFontSize * 1.2) + ((rows - 1) * LEGEND_VERTICAL_GAP) + 12
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
        let marginLeft = 40;
        let marginRight = 40;
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
            // 40px base minimum + width + small gap
            marginRight = Math.max(40, dataComplexity.maxValueWidthPx + 16);
        }

        // LEFT: Match right margin for symmetry OR use minimal for Stacked
        if (rules.marginPriority.includes('left')) {
            if (isStacked) {
                // Stacked Layout: Labels are on top, so left margin is just padding
                // But we still need to calculate wrapped labels for the FULL WIDTH

                const smartResult = SmartLabelWrapper.calculateSmartMargin(
                    labels,
                    analysis.availableSpace.width,
                    baseFontSize,
                    fontFamily,
                    '400',
                    target,
                    analysis.chartType,
                    true // isStacked = true
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
                const smartResult = SmartLabelWrapper.calculateSmartMargin(
                    labels,
                    analysis.availableSpace.width,
                    baseFontSize,
                    fontFamily,
                    '400',
                    target,
                    analysis.chartType,
                    false
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
                analysis.mode
            );
            marginBottom = legendDims.height + 10; // legend + gap
        } else {
            marginBottom = 30;
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
        datasetColors: string[]
    ): ComputedLayout {
        const width = analysis.availableSpace.width;
        const height = analysis.availableSpace.height;

        const dataset = chart.data.datasets?.[0];
        const values = dataset?.data || [];
        const total = values.reduce((a, b) => a + b, 0);
        const maxValue = Math.max(...values);
        const labels = chart.data.labels || [];

        // Constants for Radial Layout
        const MAX_RADIAL_LABEL_WIDTH = 140;
        const SPIDER_LEG_X_EXTENSION = 40;
        const MIN_VERTICAL_GAP = 4;

        // 1. Pre-analysis: Wrap text and determine space needs
        let maxLabelWidthNeeded = 0;
        let needsExternal = values.length > 8;

        // Store pre-calculated metrics to avoid re-measuring
        const measuredLabels = values.map((val, i) => {
            const labelText = labels[i] || '';

            // Fonts
            const valueFontSize = getScaledFont(baseFontSize, 'pt', 'tiny', true);
            const categoryFontSize = getScaledFont(baseFontSize, 'pt', 'tiny', false);

            // Wrap Category Label
            // We use a simplified wrapping logic here or fallback to splitting by words
            // Since we don't have a robust helper exposed, we simulate it:
            const words = labelText.toUpperCase().split(/\s+/);
            let currentLine = words[0] || '';
            const wrappedLines: string[] = [];

            for (let w = 1; w < words.length; w++) {
                const testLine = currentLine + ' ' + words[w];
                const testWidth = textMeasurementService.measureTextWidth({
                    text: testLine,
                    fontSize: categoryFontSize,
                    fontFamily,
                    fontWeight: '400'
                });
                if (testWidth <= MAX_RADIAL_LABEL_WIDTH) {
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
            const maxCategoryWidth = Math.max(...categoryWidths, 0);

            // Measure Value
            const percentage = ((val / total) * 100).toFixed(1);
            const valueMetrics = textMeasurementService.measureDetailedMetrics({
                text: `${percentage}%`, fontSize: valueFontSize, fontFamily, fontWeight: '900'
            });

            // Total Block Dimensions
            const totalWidth = Math.max(maxCategoryWidth, valueMetrics.width);
            // Height: (Category Lines * LineHeight) + Value Height + Padding
            // Assuming category line height ~1.2em
            const categoryHeight = wrappedLines.length * (categoryFontSize * 1.2);
            const totalHeight = categoryHeight + valueMetrics.height + 4; // 4px padding

            return {
                wrappedLines,
                totalWidth,
                totalHeight,
                percentage,
                valueMetrics,
                maxCategoryWidth,
                categoryHeight
            };
        });

        // Determine margin needs based on wrapped widths
        // Standard radius to test fit
        const baseMargin = target === 'pdf' ? 60 : 40;
        const testPlotSize = Math.min(width - (baseMargin * 2), height - (baseMargin * 2));
        const testOuterRadius = testPlotSize / 2;
        const testInnerRadius = chart.type === 'donut' ? testOuterRadius * 0.75 : 0;

        values.forEach((val, i) => {
            const sliceAngle = (val / total) * 2 * Math.PI;
            const sliceWidthAtCentroid = (testOuterRadius + testInnerRadius) / 2 * sliceAngle;
            const measure = measuredLabels[i];

            // Decision: Internal or External?
            const fitsInternal = sliceAngle >= (30 * Math.PI / 180) &&
                sliceWidthAtCentroid > measure.totalWidth + 35 &&
                (testOuterRadius - testInnerRadius) > measure.totalHeight + 20;

            if (!fitsInternal || needsExternal) {
                needsExternal = true;
                // External need: Extension + Text Width + Safety
                maxLabelWidthNeeded = Math.max(maxLabelWidthNeeded, measure.totalWidth + SPIDER_LEG_X_EXTENSION + 20);
            }
        });

        // 2. Dynamic Margins (Safety Reservation)
        const sideMargin = baseMargin + (needsExternal ? maxLabelWidthNeeded : 0);
        const margins = {
            top: baseMargin + 20,
            right: sideMargin,
            bottom: baseMargin + 20,
            left: sideMargin
        };

        // 3. Define Plot Zone
        const availableWidth = width - (margins.left + margins.right);
        const availableHeight = height - (margins.top + margins.bottom);
        const plotSize = Math.max(20, Math.min(availableWidth, availableHeight));

        const plotZone: Zone = {
            x: margins.left + (availableWidth - plotSize) / 2,
            y: margins.top + (availableHeight - plotSize) / 2,
            width: plotSize,
            height: plotSize
        };

        const centerX = plotZone.x + plotSize / 2;
        const centerY = plotZone.y + plotSize / 2;
        const outerRadius = plotSize / 2;
        const innerRadius = chart.type === 'donut' ? outerRadius * (analysis.mode === 'infographic' ? 0.75 : 0.6) : 0;

        const labelPlacements: any[] = [];
        const spiderLegs: any[] = [];
        const innerRadii: number[] = [];
        let startAngle = 0;

        // Collect proposed external placements for relaxation
        const rightSideLabels: any[] = [];
        const leftSideLabels: any[] = [];

        values.forEach((val, i) => {
            const sliceAngle = (val / total) * 2 * Math.PI;
            const labelAngle = startAngle + sliceAngle / 2;
            const measure = measuredLabels[i];

            // Variable Thickness
            let currentInnerRadius = innerRadius;
            if (analysis.mode === 'infographic' && chart.type === 'donut') {
                const weight = val / maxValue;
                const minHoleRadius = outerRadius * 0.7;
                const maxHoleRadius = outerRadius * 0.99;
                currentInnerRadius = maxHoleRadius - (weight * (maxHoleRadius - minHoleRadius));
            }
            innerRadii.push(currentInnerRadius);

            // Re-check geometric fit with FINAL radius
            const sliceWidthAtCentroid = (outerRadius + currentInnerRadius) / 2 * sliceAngle;
            const fitsWidth = sliceWidthAtCentroid > measure.totalWidth + 35;
            const fitsDepth = (outerRadius - currentInnerRadius) > measure.totalHeight + 20;
            const isNarrow = sliceAngle < (30 * Math.PI / 180);
            const isCrowded = values.length > 8;

            let strategy: 'internal' | 'external' | 'hidden' = (isNarrow || isCrowded || !fitsWidth || !fitsDepth) ? 'external' : 'internal';

            // Internal Placement
            const internalR = (outerRadius + currentInnerRadius) / 2;
            const ix = internalR * Math.cos(labelAngle - Math.PI / 2);
            const iy = internalR * Math.sin(labelAngle - Math.PI / 2);

            // External Placement (Preliminary)
            const isRightSide = (labelAngle % (2 * Math.PI)) < Math.PI;
            const textAnchor = isRightSide ? 'start' : 'end';
            const spiderLabelX = isRightSide ? outerRadius + SPIDER_LEG_X_EXTENSION : -outerRadius - SPIDER_LEG_X_EXTENSION;
            const spiderLabelY = (outerRadius + 20) * Math.sin(labelAngle - Math.PI / 2);

            // Store placement object
            const placement = {
                index: i,
                x: strategy === 'internal' ? ix : spiderLabelX,
                y: strategy === 'internal' ? iy : spiderLabelY,
                textAnchor: strategy === 'internal' ? 'middle' : textAnchor,
                strategy,
                percentage: measure.percentage,
                color: ColorService.getBestContrastColor(datasetColors[i % datasetColors.length]),
                wrappedLines: strategy === 'internal' ? [labels[i]] : measure.wrappedLines, // Use wrapped lines for external
                height: measure.totalHeight, // for collision
                labelAngle,
                isRightSide,
                sliceIndex: i,
                originalY: spiderLabelY
            };

            labelPlacements.push(placement);

            if (strategy === 'external') {
                if (isRightSide) {
                    rightSideLabels.push(placement);
                } else {
                    leftSideLabels.push(placement);
                }
            }

            startAngle += sliceAngle;
        });

        // 4. Collision Resolution (Spider Leg Relaxation)
        const relaxLabels = (items: any[]) => {
            if (items.length <= 1) return;
            // Sort by Y (top to bottom)
            items.sort((a, b) => a.originalY - b.originalY);

            // Forward pass (push down)
            for (let i = 1; i < items.length; i++) {
                const prev = items[i - 1];
                const curr = items[i];
                // Distance needed: half height of prev + half height of curr + gap
                // Simplified: dist > 30px (approx height of 2 lines)
                const requiredGap = (prev.height / 2) + (curr.height / 2) + MIN_VERTICAL_GAP;

                if (curr.y - prev.y < requiredGap) {
                    // Push current down
                    curr.y = prev.y + requiredGap;
                }
            }

            // Backward pass (push up if pushing down caused overflow or just to center)
            // Check if bottom-most element is too far down?
            // For now, simple aggressive push down is better than overlap.
            // We could center the group vertically if needed, but keeping them near radial ideal is best.
            // Let's do a simple center correction if the whole group shifted too much?
            // Skip for now, "Stack Down" is standard.
        };

        relaxLabels(rightSideLabels);
        // Left side: Sort by Y (top to bottom) as well
        relaxLabels(leftSideLabels);

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
            zones: { plot: plotZone, legend: null, xAxis: null, yAxis: null },
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
                spiderLegs
            }
        };
    }

    /**
     * Helper: Get mode-specific multipliers
     */
    private static getModeModifiers(mode: 'classic' | 'infographic'): ModeModifiers {
        return MODE_MULTIPLIERS[mode];
    }
}
