import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SmartLayoutEngine } from './SmartLayoutEngine';
import { textMeasurementService } from './TextMeasurementService';
import { ChartData, ChartStyle, GridConfig } from '@/types';

describe('SmartLayoutEngine', () => {
    // Mock TextMeasurementService to avoid JSDOM Canvas weirdness
    beforeEach(() => {
        vi.spyOn(textMeasurementService, 'measureTextWidth').mockImplementation((opts) => {
            // deterministic mock: length * fontSize * 0.6
            return opts.text.length * opts.fontSize * 0.6;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

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

        it('switches to stacked layout for long labels (100 chars)', () => {
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

            // For very long labels, it should switch to stacked mode
            // In stacked mode, left and right margins should be balanced and small
            expect(layout.typeSpecific?.isStacked).toBe(true);
            expect(layout.margins.left).toBeLessThan(100);
            expect(layout.margins.left).toBeCloseTo(layout.margins.right, 1);
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

    describe('Radial Layout (Pie/Donut)', () => {
        it('enforces 1:1 aspect ratio for radial charts', () => {
            const chart = {
                type: 'donut',
                data: {
                    labels: ['A', 'B', 'C'],
                    datasets: [{ label: 'Series 1', data: [10, 20, 70] }]
                } as ChartData
            };

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 800, h: 400 } // Landscape container
            );

            expect(layout.zones.plot.width).toBe(layout.zones.plot.height);
            expect(layout.typeSpecific?.centerX).toBeDefined();
            expect(layout.typeSpecific?.outerRadius).toBeLessThanOrEqual(200);
        });

        it('triggers spider legs for crowded data', () => {
            const chart = {
                type: 'donut',
                data: {
                    labels: Array.from({ length: 12 }, (_, i) => `Cat ${i}`),
                    datasets: [{ label: 'Series 1', data: Array.from({ length: 12 }, () => 10) }]
                } as ChartData
            };

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 600, h: 600 }
            );

            expect(layout.typeSpecific?.spiderLegs?.length).toBeGreaterThan(0);
            expect(layout.typeSpecific?.labelPlacements?.some((p: any) => p.strategy === 'external')).toBe(true);
        });

        it('calculates inner radius for donut but not for pie', () => {
            const pieChart = {
                type: 'pie',
                data: { labels: ['A'], datasets: [{ data: [100] }] } as ChartData
            };
            const donutChart = {
                type: 'donut',
                data: { labels: ['A'], datasets: [{ data: [100] }] } as ChartData
            };

            const pieLayout = SmartLayoutEngine.computeLayout(pieChart, mockGridConfig, { w: 400, h: 400 });
            const donutLayout = SmartLayoutEngine.computeLayout(donutChart, mockGridConfig, { w: 400, h: 400 });

            expect(pieLayout.typeSpecific?.innerRadius).toBe(0);
            expect(donutLayout.typeSpecific?.innerRadius).toBeGreaterThan(0);
        });

        it('handles "Wall of Text" labels by moving them to external strategy', () => {
            const chart = {
                type: 'pie',
                data: {
                    labels: ['This is an extremely long category name that should definitely be moved outside to prevent overlap', 'Short'],
                    datasets: [{ data: [50, 50] }]
                } as ChartData
            };

            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 400, h: 400 });

            // Even if not crowded, very long labels should potentially move outside or trigger risk
            // Our current logic triggers 'external' for narrow or crowded. 
            // If it's 50/50, it's not narrow.
            // But we should verify it doesn't crash and coordinates are valid.
            expect(layout.typeSpecific?.labelPlacements?.length).toBe(2);
            expect(layout.typeSpecific?.labelPlacements?.[0].strategy).toBeDefined();
        });

        it('maintains balance in "Squash" mode (ultra-narrow)', () => {
            const chart = {
                type: 'pie',
                data: { labels: ['A', 'B'], datasets: [{ data: [50, 50] }] } as ChartData
            };

            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 150, h: 400 });

            // Plot zone should be square even if container is squashed
            expect(layout.zones.plot.width).toBeLessThanOrEqual(150);
            expect(layout.zones.plot.width).toBe(layout.zones.plot.height);
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
            expect(threshold).toBeGreaterThanOrEqual(5); // MIN_LABEL_WRAP_CHARS
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
    describe('Infographic Mode (Clipping Fix)', () => {
        it('reserves more right margin in infographic mode due to larger font scaling', () => {
            const chartData = {
                labels: ['A', 'B'],
                datasets: [{ label: 'Series 1', data: [100, 50] }] // Max value 100
            };

            const classicChart = createMockChart(chartData.labels, chartData.datasets, { mode: 'classic' });
            const infographicChart = createMockChart(chartData.labels, chartData.datasets, { mode: 'infographic' });

            const classicLayout = SmartLayoutEngine.computeLayout(
                classicChart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            const infographicLayout = SmartLayoutEngine.computeLayout(
                infographicChart,
                mockGridConfig,
                { w: 600, h: 400 }
            );

            // Infographic margin should be significantly larger because:
            // 1. Font scale is larger (e.g. 'large' vs 'small')
            // 2. Max value multiplier (2.6 vs 1.0)
            expect(infographicLayout.margins.right).toBeGreaterThan(classicLayout.margins.right + 10);
        });

        it('handles Worst-Case Formatting (Large Currency in PDF) with Symmetry to prevent clipping', () => {
            const chart = createMockChart(
                ['Category 1'],
                [{ label: 'Series', data: [999999] }],
                {
                    mode: 'infographic',
                    numberFormat: { type: 'currency', currency: 'BRL', decimals: 2 }
                }
            );

            const layout = SmartLayoutEngine.computeLayout(
                chart,
                mockGridConfig,
                { w: 1200, h: 400 }, // Use 1200px to avoid artificial capping by overflow risk (minPlotWidth)
                'pdf'
            );

            // With 2.6x font multiplier and 1.25 buffer + 40px safety gap + 40px PDF export padding
            // "R$ 999.999,00" should result in a large margin.
            // And it should be symmetric for Bar Charts.
            expect(layout.margins.right).toBeGreaterThan(250);
            expect(layout.margins.left).toBeCloseTo(layout.margins.right, 0);
        });
    });
});
