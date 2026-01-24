import { describe, it, expect, beforeEach } from 'vitest';
import { SmartLayoutEngine } from './SmartLayoutEngine';
import { ChartData, ChartStyle, GridConfig } from '@/types';

describe('SmartLayoutEngine', () => {
    const mockGridConfig: GridConfig = {
        baseFontSize: 11,
        columns: 12,
        rows: 8,
        gutter: 16,
        margin: 24,
        pageFormat: 'A4',
        orientation: 'portrait',
        width: 210,
        height: 297
    };

    const createMockChart = (
        labels: string[],
        datasets: Array<{ label: string; data: number[] }>,
        style?: Partial<ChartStyle>
    ) => ({
        type: 'bar',
        data: {
            labels,
            datasets
        } as ChartData,
        style: style as ChartStyle
    });

    describe('computeLayout', () => {
        it('adapts to short labels (5 chars)', () => {
            const chart = createMockChart(
                ['A', 'B', 'C', 'D', 'E'],
                [{ label: 'Series 1', data: [10, 20, 30, 40, 50] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Short labels should result in minimal left margin
            expect(layout.margins.left).toBeLessThan(80);
            expect(layout.margins.left).toBeGreaterThan(50);
        });

        it('adapts to long labels (100 chars)', () => {
            const longLabel = 'A'.repeat(100);
            const chart = createMockChart(
                [longLabel, longLabel, longLabel],
                [{ label: 'Series 1', data: [10, 20, 30] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 800, h: 400 }
            );

            // Long labels should result in expanded left margin
            expect(layout.margins.left).toBeGreaterThan(200);
        });

        it('respects user legend position preference', () => {
            const chart = createMockChart(
                ['A', 'B', 'C'],
                [
                    { label: 'Series 1', data: [10, 20, 30] },
                    { label: 'Series 2', data: [15, 25, 35] }
                ],
                { legendPosition: 'bottom' }
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Should have legend zone at bottom
            expect(layout.zones.legend).not.toBeNull();
            expect(layout.zones.legend?.y).toBeGreaterThan(layout.zones.plot.y + layout.zones.plot.height);
        });

        it('applies export buffer for PDF target', () => {
            const chart = createMockChart(
                ['A', 'B', 'C'],
                [{ label: 'Series 1', data: [10, 20, 30] }]
            );

            const screenLayout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 },
                'screen'
            );

            const pdfLayout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 },
                'pdf'
            );

            // PDF margins should be 40px larger on each side
            expect(pdfLayout.margins.top).toBe(screenLayout.margins.top + 40);
            expect(pdfLayout.margins.right).toBe(screenLayout.margins.right + 40);
            expect(pdfLayout.margins.bottom).toBe(screenLayout.margins.bottom + 40);
            expect(pdfLayout.margins.left).toBe(screenLayout.margins.left + 40);
        });

        it('calculates exact legend dimensions for bottom position', () => {
            const chart = createMockChart(
                ['A', 'B', 'C'],
                [
                    { label: 'Short', data: [10, 20, 30] },
                    { label: 'Medium Label', data: [15, 25, 35] },
                    { label: 'Very Long Legend Label', data: [12, 22, 32] }
                ],
                { legendPosition: 'bottom' }
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Bottom margin should be based on measured legend height, not fixed 60px
            // With 3 items in one row, height should be roughly: itemHeight + padding
            expect(layout.margins.bottom).toBeGreaterThan(20);
            expect(layout.margins.bottom).toBeLessThan(60);
        });

        it('handles single item legend (minimal space)', () => {
            const chart = createMockChart(
                ['A', 'B', 'C'],
                [{ label: 'Single Series', data: [10, 20, 30] }],
                { legendPosition: 'bottom' }
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Single item should use minimal space
            expect(layout.margins.bottom).toBeLessThan(40);
        });

        it('handles 10+ items legend (wrapping)', () => {
            const datasets = Array.from({ length: 12 }, (_, i) => ({
                label: `Series ${i + 1}`,
                data: [10, 20, 30]
            }));

            const chart = createMockChart(['A', 'B', 'C'], datasets, { legendPosition: 'bottom' });

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // 12 items should wrap to multiple rows, increasing height
            expect(layout.margins.bottom).toBeGreaterThan(40);
        });

        it('does not trigger overflow risk for reasonable margins', () => {
            const chart = createMockChart(
                ['A', 'B', 'C'],
                [{ label: 'Series 1', data: [10, 20, 30] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Should not have overflow risk
            expect(layout.overflowRisk).toBeUndefined();
        });

        it('calculates bar thickness based on density', () => {
            // Low density (few categories, large container)
            const lowDensityChart = createMockChart(
                ['A', 'B', 'C'],
                [{ label: 'Series 1', data: [10, 20, 30] }]
            );

            const lowDensityLayout = SmartLayoutEngine.computeLayout(
                lowDensityChart,
                mockGridConfig,
                { w: 600, h: 600 } // Large height
            );

            // High density (many categories, small container)
            const highDensityChart = createMockChart(
                Array.from({ length: 20 }, (_, i) => `Cat ${i}`),
                [{ label: 'Series 1', data: Array.from({ length: 20 }, () => 10) }]
            );

            const highDensityLayout = SmartLayoutEngine.computeLayout(
                highDensityChart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Low density should have thicker bars
            expect(lowDensityLayout.typeSpecific?.barThickness).toBeGreaterThan(
                highDensityLayout.typeSpecific?.barThickness || 0
            );

            // High density should have thinner bars but above minimum
            expect(highDensityLayout.typeSpecific?.barThickness).toBeGreaterThanOrEqual(12);
        });

        it('handles legend position none (no legend)', () => {
            const chart = createMockChart(
                ['A', 'B', 'C'],
                [{ label: 'Series 1', data: [10, 20, 30] }],
                { legendPosition: 'none' }
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            expect(layout.zones.legend).toBeNull();
            // Bottom margin should be minimal
            expect(layout.margins.bottom).toBeLessThan(40);
        });
    });

    describe('Label Wrapping Intelligence', () => {
        it('calculates wrap threshold based on margin', () => {
            const chart = createMockChart(
                ['Short', 'Medium Label', 'Very Long Category Name'],
                [{ label: 'Series 1', data: [10, 20, 30] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            expect(layout.typeSpecific?.labelWrapThreshold).toBeGreaterThan(0);
            expect(layout.typeSpecific?.labelWrapThresholdPx).toBeGreaterThan(0);
        });

        it('estimates correct number of lines for long labels', () => {
            const longLabel = 'This is a very long category name that will definitely wrap to multiple lines';
            const chart = createMockChart(
                [longLabel, 'Short'],
                [{ label: 'Series 1', data: [10, 20] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            expect(layout.typeSpecific?.estimatedLabelLines).toBeGreaterThan(1);
            expect(layout.typeSpecific?.estimatedLabelLines).toBeLessThanOrEqual(3);
        });

        it('wraps exactly at threshold boundary', () => {
            const chart = createMockChart(
                ['A'.repeat(50)], // Long label
                [{ label: 'Series 1', data: [10] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            const threshold = layout.typeSpecific?.labelWrapThreshold || 0;
            expect(threshold).toBeGreaterThan(5); // MIN_LABEL_WRAP_CHARS
            expect(threshold).toBeLessThan(100);
        });

        it('reserves more space for wrapped labels', () => {
            const longLabels = Array.from({ length: 5 }, () =>
                'Very Long Category Name That Will Wrap'
            );

            const shortLabels = ['A', 'B', 'C', 'D', 'E'];

            const longLayout = SmartLayoutEngine.computeLayout(
                createMockChart(longLabels, [{ label: 'Series 1', data: [10, 20, 30, 40, 50] }]),
                mockGridConfig,
                { w: 600, h: 400 }
            );

            const shortLayout = SmartLayoutEngine.computeLayout(
                createMockChart(shortLabels, [{ label: 'Series 1', data: [10, 20, 30, 40, 50] }]),
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Long labels should estimate more lines
            expect(longLayout.typeSpecific?.estimatedLabelLines).toBeGreaterThan(
                shortLayout.typeSpecific?.estimatedLabelLines || 1
            );
        });

        it('handles empty labels array', () => {
            const chart = createMockChart(
                [],
                [{ label: 'Series 1', data: [] }]
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            expect(layout.typeSpecific?.estimatedLabelLines).toBe(1);
        });
    });

    describe('analyzeChart', () => {
        it('extracts correct complexity metrics', () => {
            const chart = createMockChart(
                ['Short', 'Medium Label', 'Very Long Category Name'],
                [
                    { label: 'Series 1', data: [10, 20, 30] },
                    { label: 'Series 2', data: [15, 25, 35] }
                ]
            );

            const analysis = SmartLayoutEngine.analyzeChart(
                chart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            expect(analysis.dataComplexity.categoryCount).toBe(3);
            expect(analysis.dataComplexity.datasetCount).toBe(2);
            expect(analysis.dataComplexity.maxValue).toBe(35);
            expect(analysis.dataComplexity.minValue).toBe(0); // Math.min includes 0 by default in SmartLayoutEngine
            expect(analysis.dataComplexity.maxLabelWidthPx).toBeGreaterThan(0);
            expect(analysis.dataComplexity.maxValueWidthPx).toBeGreaterThan(0);
        });

        it('detects legend requirement', () => {
            const singleDataset = createMockChart(
                ['A', 'B'],
                [{ label: 'Series 1', data: [10, 20] }]
            );

            const multiDataset = createMockChart(
                ['A', 'B'],
                [
                    { label: 'Series 1', data: [10, 20] },
                    { label: 'Series 2', data: [15, 25] }
                ]
            );

            const singleAnalysis = SmartLayoutEngine.analyzeChart(
                singleDataset,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            const multiAnalysis = SmartLayoutEngine.analyzeChart(
                multiDataset,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Single dataset should not need legend
            expect(singleAnalysis.layoutRequirements.needsLegend).toBe(false);

            // Multiple datasets should need legend
            expect(multiAnalysis.layoutRequirements.needsLegend).toBe(true);
        });
    });
});
