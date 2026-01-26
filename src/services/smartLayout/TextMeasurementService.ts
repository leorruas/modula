/**
 * Service to measure text dimensions accurately using an offscreen canvas.
 * Replaces the heuristic-based estimation (char count * multiplier).
 * 
 * Following System Architecture Rule 5.1: Measurement-First (Predictive Sizing)
 */

export interface TextMetricsOptions {
    fontFamily: string;
    fontSize: number;
    fontWeight?: string | number;
    text: string;
    target?: 'screen' | 'pdf'; // For PDF calibration
    letterSpacing?: number; // Em units (e.g. 0.08)
}

export interface DetailedTextMetrics {
    width: number;
    height: number;
    ascent: number;
    descent: number;
}

/**
 * LRU Cache Node for tracking access order
 */
interface CacheNode<T> {
    key: string;
    value: T;
    prev: CacheNode<T> | null;
    next: CacheNode<T> | null;
}

/**
 * LRU Cache implementation for text measurements
 */
class LRUCache<T> {
    private capacity: number;
    private cache: Map<string, CacheNode<T>>;
    private head: CacheNode<T> | null = null;
    private tail: CacheNode<T> | null = null;
    private hits = 0;
    private misses = 0;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key: string): T | undefined {
        const node = this.cache.get(key);
        if (!node) {
            this.misses++;
            return undefined;
        }

        this.hits++;
        this.moveToFront(node);
        return node.value;
    }

    set(key: string, value: T): void {
        let node = this.cache.get(key);

        if (node) {
            // Update existing node
            node.value = value;
            this.moveToFront(node);
        } else {
            // Create new node
            node = { key, value, prev: null, next: null };
            this.cache.set(key, node);
            this.addToFront(node);

            // Evict if over capacity
            if (this.cache.size > this.capacity) {
                this.evictLRU();
            }
        }
    }

    private moveToFront(node: CacheNode<T>): void {
        this.removeNode(node);
        this.addToFront(node);
    }

    private addToFront(node: CacheNode<T>): void {
        node.next = this.head;
        node.prev = null;

        if (this.head) {
            this.head.prev = node;
        }

        this.head = node;

        if (!this.tail) {
            this.tail = node;
        }
    }

    private removeNode(node: CacheNode<T>): void {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
    }

    private evictLRU(): void {
        if (!this.tail) return;

        this.cache.delete(this.tail.key);
        this.removeNode(this.tail);
    }

    clear(): void {
        this.cache.clear();
        this.head = null;
        this.tail = null;
        this.hits = 0;
        this.misses = 0;
    }

    get size(): number {
        return this.cache.size;
    }

    getStats(): { hits: number; misses: number; hitRate: number } {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0
        };
    }
}

class TextMeasurementService {
    private canvas: HTMLCanvasElement | null = null;
    private context: CanvasRenderingContext2D | null = null;
    private widthCache: LRUCache<number>;
    private detailedCache: LRUCache<DetailedTextMetrics>;
    private fontLoadRetries = 0;

    constructor() {
        const cacheSize = typeof window !== 'undefined'
            ? (window as any).__TEXT_CACHE_SIZE__ || 1000
            : 1000;

        this.widthCache = new LRUCache<number>(cacheSize);
        this.detailedCache = new LRUCache<DetailedTextMetrics>(cacheSize);

        // Set up font loading listener
        if (typeof window !== 'undefined' && document.fonts) {
            document.fonts.addEventListener('loadingdone', () => {
                this.clearCache();
            });
        }
    }

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
        const { text, fontSize, fontFamily, fontWeight = 'normal', target = 'screen' } = options;
        const key = `${text}:${fontSize}:${fontWeight}:${fontFamily}:${target}`;

        // Check cache first
        const cached = this.widthCache.get(key);
        if (cached !== undefined) return cached;

        const ctx = this.getContext();
        if (!ctx) {
            // Fallback for SSR
            return text.length * fontSize * 0.6;
        }

        // Set font and measure
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        let width = metrics.width;

        // Apply letter spacing if provided (heuristic: width + charCount * spacing * fontSize)
        if (options.letterSpacing) {
            // -1 because spacing is between chars? Usually CSS applies to all. CSS letter-spacing adds to every character box in some implementations, but usually after.
            // CSS: "length ... added to the default spacing between characters".
            // Simplified: length * fontSize * spacing.
            width += text.length * fontSize * options.letterSpacing;
        }

        // Apply PDF calibration if needed
        if (target === 'pdf') {
            const calibrationFactor = 1.10; // EXPORT_DRIFT_BUFFER
            width *= calibrationFactor;
        }

        // Cache the result
        this.widthCache.set(key, width);

        return width;
    }

    /**
     * Measures multiple texts in a single batch for better performance.
     * Reuses canvas context and returns results in the same order as input.
     */
    public measureBatch(options: TextMetricsOptions[]): number[] {
        return options.map(opt => this.measureTextWidth(opt));
    }

    /**
     * Measures full vertical and horizontal metrics.
     * Useful for precise layout calculations.
     */
    public measureDetailedMetrics(options: TextMetricsOptions): DetailedTextMetrics {
        const { text, fontSize, fontFamily, fontWeight = 'normal', target = 'screen' } = options;
        const key = `${text}:${fontSize}:${fontWeight}:${fontFamily}:${target}`;

        const cached = this.detailedCache.get(key);
        if (cached !== undefined) return cached;

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

        let detailed: DetailedTextMetrics = {
            width: metrics.width,
            height: ascent + descent,
            ascent,
            descent
        };

        // Apply PDF calibration if needed
        if (target === 'pdf') {
            const calibrationFactor = 1.10; // EXPORT_DRIFT_BUFFER
            detailed = {
                width: detailed.width * calibrationFactor,
                height: detailed.height * calibrationFactor,
                ascent: detailed.ascent * calibrationFactor,
                descent: detailed.descent * calibrationFactor
            };
        }

        this.detailedCache.set(key, detailed);

        return detailed;
    }

    /**
     * Clears the measurement cache.
     * Useful when fonts are loaded dynamically.
     */
    public clearCache(): void {
        this.widthCache.clear();
        this.detailedCache.clear();
    }

    /**
     * Returns cache statistics for monitoring and debugging.
     */
    public getCacheStats(): {
        widthCache: { size: number; hits: number; misses: number; hitRate: number };
        detailedCache: { size: number; hits: number; misses: number; hitRate: number };
    } {
        return {
            widthCache: {
                size: this.widthCache.size,
                ...this.widthCache.getStats()
            },
            detailedCache: {
                size: this.detailedCache.size,
                ...this.detailedCache.getStats()
            }
        };
    }

    /**
     * Returns a promise that resolves when all document fonts are ready.
     * Ensures measurements are accurate after font loading.
     * Includes retry mechanism for robustness.
     */
    public async fontsReady(): Promise<boolean> {
        if (typeof window === 'undefined' || !document.fonts) return true;

        const maxRetries = 3;
        const retryDelay = 100;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await document.fonts.ready;
                this.clearCache(); // Force recalculation after fonts load
                this.fontLoadRetries = 0;
                return true;
            } catch (e) {
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                } else {
                    console.warn('Font loading failed after retries, proceeding with fallbacks');
                    return false;
                }
            }
        }

        return false;
    }
}

// Singleton instance
export const textMeasurementService = new TextMeasurementService();
