import { toast } from "sonner";
import * as htmlToImage from "html-to-image";

/**
 * Generates a high-resolution PNG Base64 string from a DOM element using html-to-image.
 * This handles font embedding, gradients, and computed styles automatically.
 */
export async function generateChartImage(
    element: HTMLElement,
    options?: { backgroundColor?: string; pixelRatio?: number; skipCrop?: boolean; padding?: number }
): Promise<{ dataUrl: string; width: number; height: number; x: number; y: number }> {
    try {
        // 1. Measure Dimensions
        // Use offsetWidth/Height to get the UN-SCALED layout size.
        // getBoundingClientRect is affected by the parent's CSS transform (zoom), causing low-res/shifted exports when zoomed out.
        const originalWidth = element.offsetWidth;
        const originalHeight = element.offsetHeight;

        // PADDING: Add padding for the background (Default 40px unless overridden)
        const padding = options?.padding !== undefined ? options.padding : 40;
        const width = originalWidth + (padding * 2);
        const height = originalHeight + (padding * 2);

        // Use style.left/top for positioning context if needed, fallback to 0
        const x = parseFloat(element.style.left || '0');
        const y = parseFloat(element.style.top || '0');

        // 2. Generate PNG
        // pixelRatio: 3 ensures ~300 DPI.
        const dataUrl = await htmlToImage.toPng(element, {
            backgroundColor: options?.backgroundColor || undefined, // Default to transparent (undefined)
            pixelRatio: options?.pixelRatio || 3,
            width: width,
            height: height,
            cacheBust: true,
            skipAutoScale: true,
            // FILTER: Eclude selection UI elements
            filter: (node) => {
                const el = node as HTMLElement;
                // Exclude selection border
                if (el.classList?.contains('selection-outline')) return false;
                // Exclude resize handles (identified by cursor style or specific box-shadow if needed, but usually sibling divs)
                // The resize handle in Canvas.tsx is a div with explicit style.cursor = 'se-resize'.
                if (el.style?.cursor === 'se-resize') return false;
                // Exclude validation messages
                if (el.innerText?.includes('Validation Issues')) return false;
                return true;
            },
            style: {
                transform: 'none',
                margin: '0',
                left: `${padding}px`, // Offset content by padding
                top: `${padding}px`,
            },
            fontEmbedCSS: '', // WORKAROUND: Prevent "font is undefined" crash
        });

        return {
            dataUrl,
            width: originalWidth, // Return original dims for PDF layout logic
            height: originalHeight,
            x,
            y
        };

    } catch (error) {
        console.error('Error generating chart image:', error);
        throw error;
    } // End try-catch
}

/**
 * Exports a chart to PNG format.
 */
export async function exportChartToPng(chartId: string, options: { removeWhitespace?: boolean } = {}) {
    const containerId = `chart-container-${chartId}`;
    const container = document.getElementById(containerId);

    if (!container) {
        toast.error("Erro ao encontrar o gráfico.");
        return;
    }

    try {
        const { dataUrl } = await generateChartImage(container);

        const link = document.createElement('a');
        link.download = `chart-${chartId}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Gráfico exportado!");
    } catch (e) {
        console.error('Export failed', e);
        toast.error("Falha na exportação. Tente novamente.");
    }
}
