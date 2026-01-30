import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SmartLayoutEngine } from './SmartLayoutEngine';
import { textMeasurementService } from './TextMeasurementService';
import { ChartData, ChartStyle, GridConfig } from '@/types';

describe('SmartLayoutEngine Features (V2 Refined)', () => {
    // Mock TextMeasurementService
    beforeEach(() => {
        vi.spyOn(textMeasurementService, 'measureTextWidth').mockImplementation((opts) => {
            return opts.text.length * opts.fontSize * 0.6;
        });
        vi.spyOn(textMeasurementService, 'measureDetailedMetrics').mockImplementation((opts) => {
            return {
                width: opts.text.length * opts.fontSize * 0.6,
                height: opts.fontSize * 1.2,
                actualBoundingBoxAscent: opts.fontSize,
                actualBoundingBoxDescent: opts.fontSize * 0.2
            } as any;
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

    const createPieChart = (data: number[], style?: Partial<ChartStyle>) => ({
        type: 'pie',
        data: {
            labels: data.map((_, i) => `Label ${i}`),
            datasets: [{ label: 'Series 1', data }]
        } as ChartData,
        style: style as ChartStyle
    });

    describe('Visual Geometry Exposure', () => {
        it('returns slices array in computed layout', () => {
            const chart = createPieChart([10, 20, 30]);
            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 400, h: 400 });

            expect(layout.typeSpecific?.slices).toBeDefined();
            expect(layout.typeSpecific?.slices?.length).toBe(3);

            const firstSlice = layout.typeSpecific?.slices?.[0];
            expect(firstSlice?.startAngle).toBeDefined();
            expect(firstSlice?.endAngle).toBeDefined();
            expect(firstSlice?.color).toBeDefined();
        });
    });

    describe('Minimum Slice Angle (20 deg)', () => {
        it('ensures tiny slices get ~20 degrees visual representation', () => {
            // 1 vs 1000. 
            // 20 degrees is 20/360 * 100 = 5.5% visual weight.
            // 20 degrees in radians = ~0.349
            const chart = createPieChart([1, 1000]);
            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 400, h: 400 });

            const slices = layout.typeSpecific?.slices || [];
            const tinySlice = slices[0]; // The value 1
            const angleDiff = tinySlice.endAngle - tinySlice.startAngle;

            // Expected: ~20 degrees in radians
            const expectedRad = (20 * Math.PI) / 180;
            expect(angleDiff).toBeCloseTo(expectedRad, 1);
        });
    });

    describe('Columnar Layout Strategies', () => {
        it('forces labels to left when "column-left" is selected', () => {
            const chart = createPieChart([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], {
                infographicConfig: { labelLayout: 'column-left' }
            });
            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 600, h: 400 });

            const placements = layout.typeSpecific?.labelPlacements || [];
            // Strategy can be internal (if it fits) or external (if it doesn't)
            // But all EXTERNAL labels should be on the left side (x < 0)
            const externals = placements.filter((p: any) => p.strategy === 'external');
            expect(externals.every((p: any) => p.x < 0)).toBe(true);
            expect(externals.length).toBeGreaterThan(0); // Ensure some are external
        });

        it('forces labels to right when "column-right" is selected', () => {
            const chart = createPieChart([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], {
                infographicConfig: { labelLayout: 'column-right' }
            });
            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 600, h: 400 });

            const placements = layout.typeSpecific?.labelPlacements || [];
            // Center-Relative: All EXTERNAL labels should be positive (right side)
            const externals = placements.filter((p: any) => p.strategy === 'external');
            expect(externals.every((p: any) => p.x > 0)).toBe(true);
            expect(externals.length).toBeGreaterThan(0);
        });

        it('splits labels when "balanced" is selected', () => {
            // Create data that spans around the circle
            // 4 slices of equal size (90 deg each) -> TopRight, BottomRight, BottomLeft, TopLeft
            const chart = createPieChart([25, 25, 25, 25], {
                infographicConfig: { labelLayout: 'balanced' }
            });
            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 600, h: 400 });

            const placements = layout.typeSpecific?.labelPlacements || [];
            // Should have some on left (x < 0), some on right (x > 0)
            const lefts = placements.filter((p: any) => p.x < 0).length;
            const rights = placements.filter((p: any) => p.x > 0).length;

            expect(lefts).toBeGreaterThan(0);
            expect(rights).toBeGreaterThan(0);
        });
        it('reclaims space (collapses margins) when all labels fit internally', () => {
            // A single massive slice (1000) will definitely fit its label internally
            const chart = createPieChart([1000], {
                infographicConfig: { labelLayout: 'column-left' }
            });
            // Container 600x400. column-left would normally reserve ~200px for labels.
            const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 600, h: 400 });

            // If it collapsed, margins.left should be small (~30px)
            // instead of the large safeDynamicMargin (~200px)
            expect(layout.margins.left).toBeLessThan(100);
            expect(layout.zones.plot.width).toBeGreaterThan(300);
        });
    });
});
