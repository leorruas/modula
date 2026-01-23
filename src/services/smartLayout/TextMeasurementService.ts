/**
 * Service to measure text dimensions accurately using an offscreen canvas.
 * Replaces the heuristic-based estimation (char count * multiplier).
 * 
 * Following System Architecture Rule 5.1: Measurement-First (Predictive Sizing)
 */

interface TextMetricsOptions {
    fontFamily: string;
    fontSize: number;
    fontWeight?: string | number;
    text: string;
}

export interface DetailedTextMetrics {
    width: number;
    height: number;
    ascent: number;
    descent: number;
}

class TextMeasurementService {
    private canvas: HTMLCanvasElement | null = null;
    private context: CanvasRenderingContext2D | null = null;
    private widthCache: Map<string, number> = new Map();
    private detailedCache: Map<string, DetailedTextMetrics> = new Map();
    private MAX_CACHE_SIZE = 1000;

    private getContext(): CanvasRenderingContext2D | null {
        if (typeof window === 'undefined') return null; // Server-side safety

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
        }
        return this.context;
    }

    /**
     * Measures the width of a text string with specific font settings.
     * Uses browser's native text measurement for pixel-perfect accuracy.
     */
    public measureTextWidth(options: TextMetricsOptions): number {
        const { text, fontSize, fontFamily, fontWeight = 'normal' } = options;
        const key = `${text}:${fontSize}:${fontWeight}:${fontFamily}`;

        // Check cache first
        if (this.widthCache.has(key)) return this.widthCache.get(key)!;

        const ctx = this.getContext();
        if (!ctx) {
            // Fallback for SSR
            return text.length * fontSize * 0.6;
        }

        // Set font and measure
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        const width = metrics.width;

        // Cache the result
        if (this.widthCache.size > this.MAX_CACHE_SIZE) {
            this.widthCache.clear(); // Simple cache eviction
        }
        this.widthCache.set(key, width);

        return width;
    }

    /**
     * Measures full vertical and horizontal metrics.
     * Useful for precise layout calculations.
     */
    public measureDetailedMetrics(options: TextMetricsOptions): DetailedTextMetrics {
        const { text, fontSize, fontFamily, fontWeight = 'normal' } = options;
        const key = `${text}:${fontSize}:${fontWeight}:${fontFamily}`;

        if (this.detailedCache.has(key)) return this.detailedCache.get(key)!;

        const ctx = this.getContext();
        const fallback = {
            width: text.length * fontSize * 0.6,
            height: fontSize * 1.2,
            ascent: fontSize,
            descent: fontSize * 0.2
        };

        if (!ctx) return fallback;

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);

        // Use modern metrics if available
        const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize;
        const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || (fontSize * 0.2);

        const detailed: DetailedTextMetrics = {
            width: metrics.width,
            height: ascent + descent,
            ascent,
            descent
        };

        if (this.detailedCache.size > this.MAX_CACHE_SIZE) {
            this.detailedCache.clear();
        }
        this.detailedCache.set(key, detailed);

        return detailed;
    }

    /**
     * Clears the measurement cache.
     * Useful when fonts are loaded dynamically.
     */
    public clearCache() {
        this.widthCache.clear();
        this.detailedCache.clear();
    }

    /**
     * Returns a promise that resolves when all document fonts are ready.
     * Ensures measurements are accurate after font loading.
     */
    public async fontsReady(): Promise<boolean> {
        if (typeof window === 'undefined' || !document.fonts) return true;

        try {
            await document.fonts.ready;
            this.clearCache(); // Force recalculation after fonts load
            return true;
        } catch (e) {
            console.warn('Font loading failed, proceeding with fallbacks');
            return false;
        }
    }
}

// Singleton instance
export const textMeasurementService = new TextMeasurementService();
