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
            // FALLBACK STRATEGY: Redundant for Vector charts but harmless for Raster
            // We revert the aggressive 'important' patches as they pollute the codebase
            // and vector strategy handles Treemaps now.
            onClone: (clonedNode: HTMLElement | Node) => {
                // QUICK FIX for Glassmorphism/Filter Issues in PDF Export
                if (clonedNode instanceof HTMLElement) {
                    const checkAndRemoveFilter = (el: HTMLElement) => {
                        // Remove complex filters
                        if (el.style && (el.style.filter || el.style.backdropFilter)) {
                            // Target specifically the heavy glass filters or broad shadows
                            if (el.style.filter.includes('url(#ig-') || el.style.filter.includes('treemap-glass-filter')) {
                                el.style.filter = 'none';
                                el.style.backdropFilter = 'none';
                            }
                        }

                        // Also strip simple 'filter' attribute if present on SVG elements
                        if (el.hasAttribute('filter')) {
                            const val = el.getAttribute('filter') || '';
                            if (val.includes('url(#ig-') || val.includes('treemap-glass-filter')) {
                                el.removeAttribute('filter');
                            }
                        }

                        Array.from(el.children).forEach(child => checkAndRemoveFilter(child as HTMLElement));
                    };
                    checkAndRemoveFilter(clonedNode);
                }
            },
            filter: (node: HTMLElement) => {
                const el = node as HTMLElement;
                if (!el) return true;
                if (el.classList && typeof el.classList.contains === 'function' && el.classList.contains('selection-outline')) return false;
                if (el.style && el.style.cursor === 'se-resize') return false;
                if (el.innerText && typeof el.innerText === 'string' && el.innerText.includes('Validation Issues')) return false;
                return true;
            },
            style: {
                transform: 'none',
                margin: '0',
                left: `${padding}px`, // Offset content by padding
                top: `${padding}px`
            },
        } as any);

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
 * Exports an SVG element directly to PDF using vector commands.
 * This bypasses html-to-image rasterization issues.
 */
export async function exportSvgToPdf(
    svgElement: SVGElement,
    doc: any, // type is jsPDF, but avoiding strict type deps here
    x: number,
    y: number,
    width: number,
    height: number
) {
    try {
        // Dynamic import to avoid SSR issues if any
        const { svg2pdf } = await import('svg2pdf.js');

        // Create a distinct temp SVG to avoid mutating the DOM (if needed)
        // For now, we pass the live element. svg2pdf is usually read-only.

        // Force font fallback to Helvetica for text elements to prevent "missing font" errors in PDF
        // causing garbled text.
        // We clone it to mutate safely.
        const clone = svgElement.cloneNode(true) as SVGElement;

        // Helper to recursively set generic font-family and remove conflicting styles
        const enforceSafeFonts = (node: Element) => {
            if (node.tagName === 'text' || node.tagName === 'tspan') {
                // Remove existing style attribute to prevent overrides
                node.removeAttribute('style');

                // Explicitly set font-family attribute (SVG standard)
                node.setAttribute('font-family', 'Helvetica');
                node.setAttribute('font-weight', 'bold'); // Force bold for visibility if needed, or keep original if mapped

                // Force style property just in case
                (node as SVGElement).style.fontFamily = 'Helvetica, sans-serif';
            }
            Array.from(node.children).forEach(enforceSafeFonts);
        };
        enforceSafeFonts(clone);

        // We need to append the clone to document to get computed styles? 
        // svg2pdf often needs the element to be in DOM or at least have styles.
        // But let's try rendering directly.
        // Usually creating a hidden container works best.
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.visibility = 'hidden';
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        try {
            await svg2pdf(clone, doc, {
                x,
                y,
                width,
                height,
            });
        } finally {
            document.body.removeChild(tempContainer);
        }

        return true;
    } catch (e) {
        console.error('Vector Export Failed:', e);
        throw e;
    }
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
