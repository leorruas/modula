import { describe, it, expect, beforeEach, vi } from 'vitest';
import { textMeasurementService } from './TextMeasurementService';
import type { TextMetricsOptions } from './TextMeasurementService';

describe('TextMeasurementService', () => {
    beforeEach(() => {
        // Clear cache before each test
        textMeasurementService.clearCache();
    });

    describe('measureTextWidth', () => {
        it('returns a positive width for valid text', () => {
            const width = textMeasurementService.measureTextWidth({
                text: 'Hello World',
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: '400'
            });

            expect(width).toBeGreaterThan(0);
            expect(typeof width).toBe('number');
        });

        it('returns consistent width for same text', () => {
            const options: TextMetricsOptions = {
                text: 'Test',
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: '500'
            };

            const width1 = textMeasurementService.measureTextWidth(options);
            const width2 = textMeasurementService.measureTextWidth(options);

            expect(width1).toBe(width2);
        });

        it('returns different widths for different text', () => {
            const width1 = textMeasurementService.measureTextWidth({
                text: 'Short',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            const width2 = textMeasurementService.measureTextWidth({
                text: 'Much Longer Text',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            expect(width2).toBeGreaterThan(width1);
        });

        it('returns different widths for different font sizes', () => {
            const width1 = textMeasurementService.measureTextWidth({
                text: 'Test',
                fontSize: 12,
                fontFamily: 'Arial'
            });

            const width2 = textMeasurementService.measureTextWidth({
                text: 'Test',
                fontSize: 24,
                fontFamily: 'Arial'
            });

            expect(width2).toBeGreaterThan(width1);
        });

        it('applies PDF calibration when target is pdf', () => {
            // Clear cache to ensure fresh measurements
            textMeasurementService.clearCache();

            const testText = 'PDF Calibration Test ' + Math.random();

            const screenWidth = textMeasurementService.measureTextWidth({
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial',
                target: 'screen'
            });

            const pdfWidth = textMeasurementService.measureTextWidth({
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial',
                target: 'pdf'
            });

            // PDF should be ~10% larger (calibration factor 1.10)
            expect(pdfWidth).toBeGreaterThan(screenWidth);
            expect(pdfWidth / screenWidth).toBeCloseTo(1.10, 1);
        });

        it('defaults to screen target when not specified', () => {
            const width1 = textMeasurementService.measureTextWidth({
                text: 'Test',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            const width2 = textMeasurementService.measureTextWidth({
                text: 'Test',
                fontSize: 14,
                fontFamily: 'Arial',
                target: 'screen'
            });

            expect(width1).toBe(width2);
        });
    });

    describe('measureBatch', () => {
        it('measures multiple texts in one call', () => {
            const options: TextMetricsOptions[] = [
                { text: 'First', fontSize: 14, fontFamily: 'Arial' },
                { text: 'Second', fontSize: 14, fontFamily: 'Arial' },
                { text: 'Third', fontSize: 14, fontFamily: 'Arial' }
            ];

            const widths = textMeasurementService.measureBatch(options);

            expect(widths).toHaveLength(3);
            expect(widths.every(w => w > 0)).toBe(true);
        });

        it('returns results in correct order', () => {
            const options: TextMetricsOptions[] = [
                { text: 'A', fontSize: 14, fontFamily: 'Arial' },
                { text: 'AAAA', fontSize: 14, fontFamily: 'Arial' },
                { text: 'AA', fontSize: 14, fontFamily: 'Arial' }
            ];

            const widths = textMeasurementService.measureBatch(options);

            // Longer text should have larger width
            expect(widths[1]).toBeGreaterThan(widths[2]);
            expect(widths[2]).toBeGreaterThan(widths[0]);
        });

        it('handles empty array', () => {
            const widths = textMeasurementService.measureBatch([]);
            expect(widths).toHaveLength(0);
        });
    });

    describe('measureDetailedMetrics', () => {
        it('returns all required metrics', () => {
            const metrics = textMeasurementService.measureDetailedMetrics({
                text: 'Test',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            expect(metrics).toHaveProperty('width');
            expect(metrics).toHaveProperty('height');
            expect(metrics).toHaveProperty('ascent');
            expect(metrics).toHaveProperty('descent');

            expect(metrics.width).toBeGreaterThan(0);
            expect(metrics.height).toBeGreaterThan(0);
            expect(metrics.ascent).toBeGreaterThan(0);
            expect(metrics.descent).toBeGreaterThan(0);
        });

        it('applies PDF calibration to all metrics', () => {
            textMeasurementService.clearCache();

            const testText = 'Detailed Metrics Test ' + Math.random();

            const screenMetrics = textMeasurementService.measureDetailedMetrics({
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial',
                target: 'screen'
            });

            const pdfMetrics = textMeasurementService.measureDetailedMetrics({
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial',
                target: 'pdf'
            });

            // All metrics should be ~10% larger for PDF
            expect(pdfMetrics.width / screenMetrics.width).toBeCloseTo(1.10, 1);
            expect(pdfMetrics.height / screenMetrics.height).toBeCloseTo(1.10, 1);
            expect(pdfMetrics.ascent / screenMetrics.ascent).toBeCloseTo(1.10, 1);
            expect(pdfMetrics.descent / screenMetrics.descent).toBeCloseTo(1.10, 1);
        });

        it('height equals ascent plus descent', () => {
            const metrics = textMeasurementService.measureDetailedMetrics({
                text: 'Test',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            expect(metrics.height).toBeCloseTo(metrics.ascent + metrics.descent, 1);
        });
    });

    describe('cache', () => {
        it('caches measurements', () => {
            textMeasurementService.clearCache();

            const testText = 'Cache Test ' + Math.random();
            const options: TextMetricsOptions = {
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial'
            };

            // First call - should be a miss
            textMeasurementService.measureTextWidth(options);

            const statsBefore = textMeasurementService.getCacheStats();
            expect(statsBefore.widthCache.size).toBeGreaterThan(0);

            // Second call should hit cache
            textMeasurementService.measureTextWidth(options);

            const statsAfter = textMeasurementService.getCacheStats();
            expect(statsAfter.widthCache.hits).toBeGreaterThan(statsBefore.widthCache.hits);
        });

        it('evicts least recently used items when full', () => {
            // Fill cache beyond capacity (1000 items)
            // We'll add 1001 unique measurements
            for (let i = 0; i < 1001; i++) {
                textMeasurementService.measureTextWidth({
                    text: `Text ${i}`,
                    fontSize: 14,
                    fontFamily: 'Arial'
                });
            }

            const stats = textMeasurementService.getCacheStats();
            // Cache should not exceed 1000 items
            expect(stats.widthCache.size).toBeLessThanOrEqual(1000);
        });

        it('tracks cache statistics accurately', () => {
            textMeasurementService.clearCache();

            const testText = 'Stats Test ' + Math.random();
            const options: TextMetricsOptions = {
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial'
            };

            // First call: miss
            textMeasurementService.measureTextWidth(options);
            let stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.misses).toBeGreaterThan(0);

            // Second call: hit
            textMeasurementService.measureTextWidth(options);
            stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.hits).toBeGreaterThan(0);

            // Hit rate should be positive
            expect(stats.widthCache.hitRate).toBeGreaterThan(0);
            expect(stats.widthCache.hitRate).toBeLessThanOrEqual(1);
        });

        it('clears cache correctly', () => {
            textMeasurementService.clearCache();

            const testText = 'Clear Test ' + Math.random();
            textMeasurementService.measureTextWidth({
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial'
            });

            let stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.size).toBeGreaterThan(0);

            textMeasurementService.clearCache();

            stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.size).toBe(0);
            expect(stats.widthCache.hits).toBe(0);
            expect(stats.widthCache.misses).toBe(0);
        });

        it('maintains separate caches for width and detailed metrics', () => {
            textMeasurementService.clearCache();

            const testText = 'Separate Cache Test ' + Math.random();
            const options: TextMetricsOptions = {
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial'
            };

            textMeasurementService.measureTextWidth(options);
            textMeasurementService.measureDetailedMetrics(options);

            const stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.size).toBeGreaterThan(0);
            expect(stats.detailedCache.size).toBeGreaterThan(0);
        });
    });

    describe('fontsReady', () => {
        it('resolves successfully', async () => {
            const result = await textMeasurementService.fontsReady();
            expect(typeof result).toBe('boolean');
        });

        it('clears cache after fonts are ready', async () => {
            textMeasurementService.clearCache();

            // Add some measurements
            const testText = 'Font Ready Test ' + Math.random();
            textMeasurementService.measureTextWidth({
                text: testText,
                fontSize: 14,
                fontFamily: 'Arial'
            });

            let stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.size).toBeGreaterThan(0);

            // Wait for fonts
            await textMeasurementService.fontsReady();

            // Cache should be cleared
            stats = textMeasurementService.getCacheStats();
            expect(stats.widthCache.size).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('handles empty string', () => {
            const width = textMeasurementService.measureTextWidth({
                text: '',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            expect(width).toBeGreaterThanOrEqual(0);
        });

        it('handles very long text', () => {
            const longText = 'A'.repeat(1000);
            const width = textMeasurementService.measureTextWidth({
                text: longText,
                fontSize: 14,
                fontFamily: 'Arial'
            });

            expect(width).toBeGreaterThan(0);
        });

        it('handles special characters', () => {
            const width = textMeasurementService.measureTextWidth({
                text: '你好世界 🌍 émojis',
                fontSize: 14,
                fontFamily: 'Arial'
            });

            expect(width).toBeGreaterThan(0);
        });

        it('handles different font weights', () => {
            const normalWidth = textMeasurementService.measureTextWidth({
                text: 'Test',
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: '400'
            });

            const boldWidth = textMeasurementService.measureTextWidth({
                text: 'Test',
                fontSize: 14,
                fontFamily: 'Arial',
                fontWeight: '700'
            });

            // Bold text should typically be wider (though not guaranteed for all fonts)
            expect(boldWidth).toBeGreaterThanOrEqual(normalWidth);
        });
    });
});
