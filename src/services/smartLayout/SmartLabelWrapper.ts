import { textMeasurementService } from './TextMeasurementService';

/**
 * Analysis result for a set of labels
 */
export interface LabelAnalysis {
    longestLabel: string;
    longestLabelWidth: number;
    longestLabelIndex: number;
    wordCount: number;
    avgWordLength: number;
    hasLongWords: boolean; // words > 15 chars
    maxWordsInLabel: number;
}

/**
 * Result of optimal wrapping calculation
 */
export interface WrapResult {
    lines: string[];
    requiredWidth: number;
    orphanRisk: boolean;
    lineCount: number;
}

/**
 * Wrapping strategy based on container and label characteristics
 */
export type WrappingStrategy =
    | 'minimal'      // Short labels, minimal margin
    | 'tight'        // Medium labels, 2 lines max
    | 'aggressive'   // Long labels in small containers, 3 lines
    | 'comfortable'  // Long labels in large containers, 2 lines preferred
    | 'no-wrap';     // Labels fit without wrapping

/**
 * Smart Label Wrapper Service
 * Provides intelligent label wrapping with orphan prevention and adaptive strategies
 */
export class SmartLabelWrapper {
    /**
     * Analyze a set of labels to determine characteristics
     */
    static analyzeLabels(
        labels: string[],
        fontSize: number,
        fontFamily: string,
        fontWeight: string = '400'
    ): LabelAnalysis {
        if (labels.length === 0) {
            return {
                longestLabel: '',
                longestLabelWidth: 0,
                longestLabelIndex: -1,
                wordCount: 0,
                avgWordLength: 0,
                hasLongWords: false,
                maxWordsInLabel: 0
            };
        }

        let longestLabel = '';
        let longestLabelWidth = 0;
        let longestLabelIndex = 0;
        let totalWords = 0;
        let totalChars = 0;
        let hasLongWords = false;
        let maxWordsInLabel = 0;

        labels.forEach((label, index) => {
            const width = textMeasurementService.measureTextWidth({
                text: label,
                fontSize,
                fontFamily,
                fontWeight
            });

            if (width > longestLabelWidth) {
                longestLabel = label;
                longestLabelWidth = width;
                longestLabelIndex = index;
            }

            const words = label.split(' ');
            totalWords += words.length;
            maxWordsInLabel = Math.max(maxWordsInLabel, words.length);

            words.forEach(word => {
                totalChars += word.length;
                if (word.length > 15) {
                    hasLongWords = true;
                }
            });
        });

        const avgWordLength = totalWords > 0 ? totalChars / totalWords : 0;

        return {
            longestLabel,
            longestLabelWidth,
            longestLabelIndex,
            wordCount: totalWords,
            avgWordLength,
            hasLongWords,
            maxWordsInLabel
        };
    }

    /**
     * Select wrapping strategy based on container size and label characteristics
     */
    static selectWrappingStrategy(
        containerWidth: number,
        analysis: LabelAnalysis
    ): WrappingStrategy {
        const { maxWordsInLabel, longestLabelWidth } = analysis;

        // Container size categories
        const isSmall = containerWidth < 400;
        const isMedium = containerWidth >= 400 && containerWidth < 600;
        const isLarge = containerWidth >= 600;

        // Label size categories
        const isShort = maxWordsInLabel <= 2;
        const isMediumLabel = maxWordsInLabel > 2 && maxWordsInLabel <= 6;
        const isLong = maxWordsInLabel > 6;

        // Strategy selection matrix
        if (isSmall) {
            if (isShort) return 'minimal';
            if (isMediumLabel) return 'tight';
            return 'aggressive';
        }

        if (isMedium) {
            if (isShort) return 'minimal';
            if (isMediumLabel) return 'comfortable';
            return 'comfortable';
        }

        // isLarge
        if (isShort) return 'minimal';
        if (isMediumLabel && longestLabelWidth < containerWidth * 0.3) return 'no-wrap';
        return 'comfortable';
    }

    /**
     * Calculate optimal line wrapping with orphan prevention
     */
    static calculateOptimalWrap(
        label: string,
        availableWidth: number,
        fontSize: number,
        fontFamily: string,
        fontWeight: string = '400',
        maxWordsPerLine: number = 12
    ): WrapResult {
        // Step 1: Check if we can fit without wrapping
        const fullWidth = textMeasurementService.measureTextWidth({
            text: label,
            fontSize,
            fontFamily,
            fontWeight
        });

        if (fullWidth <= availableWidth) {
            return {
                lines: [label],
                requiredWidth: fullWidth,
                orphanRisk: false,
                lineCount: 1
            };
        }

        // Step 2: Split into words
        const words = label.split(' ');

        if (words.length === 1) {
            // Single long word - can't wrap
            return {
                lines: [label],
                requiredWidth: fullWidth,
                orphanRisk: false,
                lineCount: 1
            };
        }

        // Step 3: Build lines greedily
        const lines: string[] = [];
        let currentLine: string[] = [];

        for (const word of words) {
            const testLine = [...currentLine, word].join(' ');
            const testWidth = textMeasurementService.measureTextWidth({
                text: testLine,
                fontSize,
                fontFamily,
                fontWeight
            });

            if (testWidth <= availableWidth && currentLine.length < maxWordsPerLine) {
                currentLine.push(word);
            } else {
                if (currentLine.length > 0) {
                    lines.push(currentLine.join(' '));
                }
                currentLine = [word];
            }
        }

        // Add last line
        if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
        }

        // Step 4: Check for orphans (last line with only 1 word)
        const orphanRisk = lines.length > 1 && lines[lines.length - 1].split(' ').length === 1;

        // Step 5: If orphan detected, redistribute
        if (orphanRisk && lines.length >= 2) {
            const lastWord = lines.pop()!;
            const secondLastLine = lines.pop()!;
            const combined = `${secondLastLine} ${lastWord}`;

            // Try to fit in one line
            const combinedWidth = textMeasurementService.measureTextWidth({
                text: combined,
                fontSize,
                fontFamily,
                fontWeight
            });

            if (combinedWidth <= availableWidth) {
                lines.push(combined);
            } else {
                // Split more evenly
                const allWords = combined.split(' ');
                const mid = Math.ceil(allWords.length / 2);
                lines.push(allWords.slice(0, mid).join(' '));
                lines.push(allWords.slice(mid).join(' '));
            }
        }

        // Step 6: Measure required width (widest line)
        const requiredWidth = Math.max(...lines.map(line =>
            textMeasurementService.measureTextWidth({
                text: line,
                fontSize,
                fontFamily,
                fontWeight
            })
        ));

        return {
            lines,
            requiredWidth,
            orphanRisk: false,
            lineCount: lines.length
        };
    }

    /**
     * Calculate smart margin based on container size and label characteristics
     */
    static calculateSmartMargin(
        labels: string[],
        containerWidth: number,
        baseFontSize: number,
        fontFamily: string,
        fontWeight: string = '400',
        target: 'screen' | 'pdf' = 'screen',
        chartType: string = 'bar'
    ): {
        marginLeft: number;
        wrappedLabels: string[][];
        strategy: WrappingStrategy;
    } {
        // Constants
        const EXPORT_BUFFER = target === 'pdf' ? 15 : 8;  // Reduced buffers

        // Chart-specific plot ratio (MAXIMUM allowed for labels)
        // Drastically reduced - margin should be based on actual measurements, not percentages
        const MAX_LABEL_RATIO = chartType === 'bar' ? 0.30 : 0.25;  // Bar: 30%, Others: 25%

        const LABEL_PADDING = 6;   // Reduced from 8
        const LABEL_GUTTER = 4;    // Reduced from 6

        // Step 1: Analyze labels
        const analysis = this.analyzeLabels(labels, baseFontSize, fontFamily, fontWeight);

        if (labels.length === 0 || !analysis.longestLabel) {
            return {
                marginLeft: 60,
                wrappedLabels: [],
                strategy: 'minimal'
            };
        }

        // Step 2: Select strategy
        const strategy = this.selectWrappingStrategy(containerWidth, analysis);

        // Step 3: Calculate MAXIMUM allowed margin (not the target!)
        const maxAllowedMargin = containerWidth * MAX_LABEL_RATIO;

        // Step 4: First, try to fit labels WITHOUT wrapping
        const longestLabelWidth = analysis.longestLabelWidth;
        const requiredMarginNoWrap = longestLabelWidth + LABEL_PADDING + LABEL_GUTTER + EXPORT_BUFFER;

        let wrappedLabels: string[][];
        let maxWrappedWidth: number;

        if (requiredMarginNoWrap <= maxAllowedMargin) {
            // Best case: labels fit without wrapping
            wrappedLabels = labels.map(label => [label]);
            maxWrappedWidth = longestLabelWidth;
        } else {
            // Need to wrap: calculate available space for wrapped text
            const availableForLabels = maxAllowedMargin - LABEL_PADDING - LABEL_GUTTER - EXPORT_BUFFER;

            // Wrap all labels
            wrappedLabels = labels.map(label =>
                this.calculateOptimalWrap(
                    label,
                    availableForLabels,
                    baseFontSize,
                    fontFamily,
                    fontWeight
                ).lines
            );

            // Find widest wrapped line across all labels
            maxWrappedWidth = 0;
            wrappedLabels.forEach(lines => {
                lines.forEach(line => {
                    const width = textMeasurementService.measureTextWidth({
                        text: line,
                        fontSize: baseFontSize,
                        fontFamily,
                        fontWeight
                    });
                    maxWrappedWidth = Math.max(maxWrappedWidth, width);
                });
            });
        }

        // Step 5: Calculate required margin based on ACTUAL label width
        const requiredMargin = maxWrappedWidth + LABEL_PADDING + LABEL_GUTTER + EXPORT_BUFFER;

        // Step 6: Apply constraints - use the SMALLER of required or max allowed
        const finalMargin = Math.max(
            55, // Reduced absolute minimum from 60
            Math.min(requiredMargin, maxAllowedMargin) // Cap at max allowed
        );

        return {
            marginLeft: finalMargin,
            wrappedLabels,
            strategy
        };
    }
}
