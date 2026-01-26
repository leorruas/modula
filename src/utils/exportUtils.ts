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
        // Use scrollWidth/scrollHeight to capture the FULL content area, even if it overflows the allotted container size.
        // This is the "Safety Net" for high-res editorial exports.
        const originalWidth = Math.max(element.scrollWidth, element.offsetWidth);
        const originalHeight = Math.max(element.scrollHeight, element.offsetHeight);

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
            // FONT SANITIZATION: html-to-image can crash if it finds CSS variables it can't resolve.
            // We ensure that common chart elements have their font-family clamped to standard fallbacks.
            // The library attempts to .trim() the font string; if it's undefined or malformed, it fails.
            fontEmbedCSS: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
                * { 
                    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; 
                }
                .hero-number, .data-label { 
                    font-family: "Courier New", Courier, monospace !important; 
                }
            `,
            // FILTER: Exclude selection UI elements
            filter: (node) => {
                const el = node as HTMLElement;
                if (!el) return true;

                // Exclude selection border
                if (el.classList && typeof el.classList.contains === 'function' && el.classList.contains('selection-outline')) return false;

                // Exclude resize handles
                if (el.style && el.style.cursor === 'se-resize') return false;

                // Exclude validation messages
                if (el.innerText && typeof el.innerText === 'string' && el.innerText.includes('Validation Issues')) return false;

                return true;
            },
            style: {
                transform: 'none',
                margin: '0',
                left: `${padding}px`, // Offset content by padding
                top: `${padding}px`,
                // Explicitly set font-family on the cloned style to prevent inheritance of broken vars
                fontFamily: '-apple-system, sans-serif'
            },
        });

        if (!dataUrl || dataUrl.length < 100) {
            console.error("Export failure: Data URL is invalid", { dataUrlLength: dataUrl?.length });
            throw new Error("Generated image is empty or too small.");
        }

        return {
            dataUrl,
            width: originalWidth, // Return original dims for PDF layout logic
            height: originalHeight,
            x,
            y
        };

    } catch (error) {
        console.error('Error in generateChartImage:', error);
        // Provide more context to the error message if possible
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('trim')) {
            throw new Error(`Font error: a biblioteca de exportação falhou ao processar as fontes. Tente mudar a fonte do gráfico. (${msg})`);
        }
        throw error;
    } // End try-catch
}

/**
 * Exports a chart to PNG format.
 */
export async function exportChartToPng(chartId: string, options: { removeWhitespace?: boolean; fileName?: string } = {}) {
    const containerId = `chart-container-${chartId}`;
    const container = document.getElementById(containerId);

    if (!container) {
        toast.error("Erro ao encontrar o gráfico.");
        return;
    }

    try {
        const { dataUrl } = await generateChartImage(container);

        const link = document.createElement('a');
        // Use provided fileName or fallback to chart ID
        link.download = options.fileName
            ? (options.fileName.endsWith('.png') ? options.fileName : `${options.fileName}.png`)
            : `chart-${chartId}.png`;
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
