import { describe, test, expect } from 'vitest';
import { ColorService } from './ColorService';

describe('ColorService', () => {
    describe('getBestContrastColor', () => {
        test('should return black for light colors', () => {
            expect(ColorService.getBestContrastColor('#ffffff')).toBe('#000000'); // White -> Black
            expect(ColorService.getBestContrastColor('#ffff00')).toBe('#000000'); // Yellow -> Black
            expect(ColorService.getBestContrastColor('#fab1a0')).toBe('#000000'); // Light Pink -> Black
        });

        test('should return white for dark colors', () => {
            expect(ColorService.getBestContrastColor('#000000')).toBe('#ffffff'); // Black -> White
            expect(ColorService.getBestContrastColor('#2d3436')).toBe('#ffffff'); // Dark Grey -> White
            expect(ColorService.getBestContrastColor('#0984e3')).toBe('#ffffff'); // Blue -> White
        });

        test('should handle short hex codes', () => {
            expect(ColorService.getBestContrastColor('#fff')).toBe('#000000');
            expect(ColorService.getBestContrastColor('#000')).toBe('#ffffff');
        });
    });

    describe('ensureDistinctColors', () => {
        const basePalette = ['#ff0000', '#00ff00', '#0000ff'];

        test('should return base palette if count <= length', () => {
            const colors = ColorService.ensureDistinctColors(basePalette, 2);
            expect(colors).toHaveLength(2);
            expect(colors).toEqual(['#ff0000', '#00ff00']);
        });

        test('should expand palette if count > length', () => {
            const colors = ColorService.ensureDistinctColors(basePalette, 4);
            expect(colors).toHaveLength(4);
            expect(colors.slice(0, 3)).toEqual(basePalette);
            // 4th color should be a variation of the 1st
            expect(colors[3]).not.toBe(basePalette[0]);
        });

        test('should generate monochromatic if base is empty', () => {
            const colors = ColorService.ensureDistinctColors([], 3);
            expect(colors).toHaveLength(3);
        });
    });

    describe('adjustBrightness', () => {
        test('should lighten color with positive amount', () => {
            const original = '#000000';
            const lighter = ColorService.adjustBrightness(original, 50);
            expect(lighter).not.toBe(original);
            expect(lighter.toUpperCase()).toBe('#323232'); // 0x32 = 50
        });

        test('should darken color with negative amount', () => {
            const original = '#ffffff';
            const darker = ColorService.adjustBrightness(original, -50);
            expect(darker).not.toBe(original);
            // 255 - 50 = 205 = 0xCD
            expect(darker.toUpperCase()).toBe('#CDCDCD');
        });
    });

    describe('determineValuePosition', () => {
        test('should return inside if bar is wide enough', () => {
            // Bar: 100px, Label: 50px, Padding: 10px -> 50 + 20 = 70px < 100px -> Fits
            const result = ColorService.determineValuePosition(100, 50, '#000000', 10);
            expect(result).toBe('inside');
        });

        test('should return outside if bar is too narrow', () => {
            // Bar: 60px, Label: 50px, Padding: 10px -> 50 + 20 = 70px > 60px -> DOES NOT Fit
            const result = ColorService.determineValuePosition(60, 50, '#000000', 10);
            expect(result).toBe('outside');
        });
    });
});
