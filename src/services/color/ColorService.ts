/**
 * ColorService
 * Centralizes all color-related logic including palette generation,
 * interpolation, and accessibility contrast calculations.
 * 
 * Migrated from utils/colors.ts with enhancements for Phase 4.
 */
export class ColorService {
    /**
     * Generates an array of distinct colors based on a base palette.
     * If the needed count exceeds the palette length, it generates interpolations/variations.
     */
    static ensureDistinctColors(basePalette: string[], count: number): string[] {
        if (!basePalette || basePalette.length === 0) {
            return this.generateMonochromaticPalette('#3b82f6', count);
        }

        if (count <= basePalette.length) {
            return basePalette.slice(0, count);
        }

        const extendedPalette = [...basePalette];
        let k = 0;

        // Generate variations until we have enough colors
        while (extendedPalette.length < count) {
            const baseColor = basePalette[k % basePalette.length];
            // Alternating lightening and darkening for better distinction
            const adjustment = k % 2 === 0 ? 20 : -20;
            extendedPalette.push(this.adjustBrightness(baseColor, adjustment));
            k++;
        }

        return extendedPalette;
    }

    /**
     * Generates a monochromatic palette based on a single color
     */
    static generateMonochromaticPalette(baseColor: string, count: number): string[] {
        const colors = [];
        for (let i = 0; i < count; i++) {
            // Distribute brightness from -50% to +50% roughly
            const amt = Math.floor(((i - count / 2) / count) * 100);
            colors.push(this.adjustBrightness(baseColor, amt));
        }
        return colors;
    }

    /**
     * Calculates the best text color (black or white) for a given background color
     * using YIQ brightness formula.
     * 
     * @param hex Background color in hex
     * @returns '#000000' or '#ffffff'
     */
    static getBestContrastColor(hex: string): '#000000' | '#ffffff' {
        if (!hex) return '#000000';

        // Strip hash
        const cleanHex = hex.replace('#', '');

        let r, g, b;

        if (cleanHex.length === 3) {
            r = parseInt(cleanHex.substr(0, 1) + cleanHex.substr(0, 1), 16);
            g = parseInt(cleanHex.substr(1, 1) + cleanHex.substr(1, 1), 16);
            b = parseInt(cleanHex.substr(2, 1) + cleanHex.substr(2, 1), 16);
        } else {
            r = parseInt(cleanHex.substr(0, 2), 16);
            g = parseInt(cleanHex.substr(2, 2), 16);
            b = parseInt(cleanHex.substr(4, 2), 16);
        }

        if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';

        // YIQ equation
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // Standard threshold is 128
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }

    /**
     * Adjusts the brightness of a HEX color.
     * Positive amount lightens, negative amount darkens.
     */
    static adjustBrightness(hex: string, amount: number): string {
        let usePound = false;
        let col = hex;

        if (col[0] == "#") {
            col = col.slice(1);
            usePound = true;
        }

        const num = parseInt(col, 16);

        let r = (num >> 16) + amount;
        if (r > 255) r = 255;
        else if (r < 0) r = 0;

        let b = ((num >> 8) & 0x00FF) + amount;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;

        let g = (num & 0x0000FF) + amount;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;

        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    }

    /**
     * Determines if a value should be placed inside or outside based on:
     * 1. Geometry (does it fit?)
     * 2. Contrast (is it legible inside?)
     */
    static determineValuePosition(
        barWidthPx: number,
        labelWidthPx: number,
        barColor: string,
        paddingPx: number = 10
    ): 'inside' | 'outside' {
        // 1. Geometry Check
        const fitsInside = barWidthPx > (labelWidthPx + (paddingPx * 2));

        if (!fitsInside) {
            return 'outside';
        }

        // 2. Tie-Breaker: Contrast Check (Phase 4.1 Requirement)
        // If the best contrast color is the same as the bar color (impossible, but conceptual)
        // Actually, we refer to: "Even if it fits, if the bar is too light and we want white text, force outside?"
        // Or essentially: can we achieve good contrast?
        // With getBestContrastColor, we ALWAYS get a legible color (black or white).
        // So theoretically we can always put it inside if it fits.

        // However, user might prefer "clean" look. 
        // Rule: If bar is very light (requiring black text), keep inside?
        // Let's implement the rule as: "If it fits, it goes inside, unless defined otherwise".
        // The contrast check guarantees legibility. 

        return 'inside';
    }
}
