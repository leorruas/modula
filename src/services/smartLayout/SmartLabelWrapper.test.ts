
import { SmartLabelWrapper } from './SmartLabelWrapper';
import { textMeasurementService } from './TextMeasurementService';

import { vi, describe, it, expect } from 'vitest';

// Mock textMeasurementService
vi.mock('./TextMeasurementService', () => ({
    textMeasurementService: {
        measureTextWidth: vi.fn(({ text, fontSize }) => {
            // Simple mock: 10px per character for easy math
            return text.length * 10;
        })
    }
}));


describe('SmartLabelWrapper', () => {
    describe('calculateSmartMargin', () => {
        // Mock container width 
        const containerWidth = 1000;
        const fontSize = 12;
        const font = 'Arial';

        // Helper to generate meaningful words
        const generateWords = (count: number) => {
            return Array.from({ length: count }, (_, i) => `word${i + 1}`).join(' ');
        }

        it('should force wrap if label exceeds 12 words even if it fits width', () => {
            // 15 words. Each "wordX" is 5 chars + space = 6 chars = 60px. 
            // 15 words * 60px = 900px. Fits in 1000px * 0.3 (max ratio) = 300px? Wait.
            // BarChart ratio is 0.30. 1000 * 0.3 = 300px max margin.
            // 900px > 300px so it would wrap anyway due to width.

            // We need a case where it fits the MAX_LABEL_RATIO but fails the word count.
            // Let's use a very wide container or short words.
            // Container 2000px. Max Margin = 600px.
            // 15 "a"s. "a a ...". 15 * 2 = 30 chars = 300px. Fits 600px.
            // Should wrap because > 12 words.

            const longShortWords = Array.from({ length: 15 }, () => 'a').join(' ');

            const result = SmartLabelWrapper.calculateSmartMargin(
                [longShortWords],
                2000,
                fontSize,
                font
            );

            // Should be wrapped
            expect(result.wrappedLabels[0].length).toBeGreaterThan(1);
        });

        it('should NOT force wrap if > 12 words but wrapping creates a widow', () => {
            // 13 words. Wraps to 12 + 1 (widow).
            // Should "un-break" back to 13 words if it fits width.

            const thirteenShortWords = Array.from({ length: 13 }, () => 'a').join(' ');

            const result = SmartLabelWrapper.calculateSmartMargin(
                [thirteenShortWords],
                2000,
                fontSize,
                font
            );

            // Should NOT be wrapped (widow prevention wins)
            expect(result.wrappedLabels[0].length).toBe(1);
        });

        it('should standard wrap if much longer than 12 words', () => {
            const twentyWords = Array.from({ length: 20 }, () => 'a').join(' ');
            const result = SmartLabelWrapper.calculateSmartMargin(
                [twentyWords],
                2000,
                fontSize,
                font
            );
            expect(result.wrappedLabels[0].length).toBeGreaterThan(1);
        });
    });
});
