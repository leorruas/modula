import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SmartLayoutEngine } from './SmartLayoutEngine';
import { textMeasurementService } from './TextMeasurementService';
import { ChartData, GridConfig } from '@/types';

describe('SmartLayoutEngine - Treemap Implementation', () => {
    // Mock TextMeasurementService for consistent unit testing
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

    const createTreemapChart = (data: number[]) => ({
        type: 'treemap',
        data: {
            labels: data.map((_, i) => `Item ${i}`),
            datasets: [{ label: 'Series 1', data }]
        } as ChartData
    });

    it('calculates squarified rectangles for data', () => {
        const chart = createTreemapChart([100, 50, 50]);
        const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 400, h: 400 });

        const positions = layout.typeSpecific?.treemapPositions || [];
        expect(positions.length).toBe(3);

        // Total area should match (roughly, allowing for margins)
        const plotZone = layout.zones.plot;
        const totalRectArea = positions.reduce((acc: number, p: any) => acc + (p.width * p.height), 0);
        const plotArea = plotZone.width * plotZone.height;

        expect(totalRectArea).toBeCloseTo(plotArea, 1);

        // Items should be sorted by value in the output sequence? 
        // Wait, the algorithm sorts them.
        expect(positions[0].value).toBe(100);
    });

    it('assigns internal labels when they fit', () => {
        const chart = createTreemapChart([1000]); // One big rect
        const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 400, h: 400 });

        const pos = layout.typeSpecific?.treemapPositions[0];
        expect(pos.strategy).toBe('internal');
        expect(pos.measure.wrappedLines).toBeDefined();
    });

    it('generates spider legs for external labels when rect is small', () => {
        // Many small items to force some external labels
        const data = Array(20).fill(10);
        const chart = createTreemapChart(data);
        const layout = SmartLayoutEngine.computeLayout(chart, mockGridConfig, { w: 200, h: 200 });

        const positions = layout.typeSpecific?.treemapPositions || [];
        const externals = positions.filter((p: any) => p.strategy === 'external');

        expect(externals.length).toBeGreaterThan(0);
        expect(externals[0].spiderLeg).toBeDefined();
        expect(externals[0].spiderLeg.points.length).toBe(2);
    });
});
