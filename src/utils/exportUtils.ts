import { toast } from "sonner";

/**
 * Sanitizes an SVG element by processing foreignObject elements.
 * This is necessary because many export tools (canvas, pdf) cannot handle foreignObject/HTML inside SVG.
 */
export function sanitizeSvg(svg: SVGElement) {
    const foreignObjects = svg.querySelectorAll('foreignObject');
    foreignObjects.forEach(fo => {
        // Check for inner SVG (used in icons)
        const innerSvg = fo.querySelector('svg');
        if (innerSvg) {
            // If it's an icon, we try to preserve it by moving the inner SVG up
            // We need to transfer positioning attributes if possible
            const x = fo.getAttribute('x') || '0';
            const y = fo.getAttribute('y') || '0';
            const width = fo.getAttribute('width');
            const height = fo.getAttribute('height');

            // Clone inner SVG and set position
            const newSvg = innerSvg.cloneNode(true) as SVGSVGElement;
            newSvg.setAttribute('x', x);
            newSvg.setAttribute('y', y);
            if (width) newSvg.setAttribute('width', width);
            if (height) newSvg.setAttribute('height', height);

            // Replace foreignObject with new SVG
            fo.parentNode?.replaceChild(newSvg, fo);
        } else {
            // If it contains non-SVG HTML (like divs), we MUST remove it
            fo.remove();
        }
    });
}

/**
 * Exports a chart to PNG format, optionally removing excess whitespace
 * by cropping to the SVG content bounding box.
 */
/**
 * Generates a high-resolution PNG Base64 string from an SVG Element.
 * Automatically expands the viewbox to capture all visible content (preventing clipping).
 */
export async function generateChartImage(
    svgElement: SVGElement
): Promise<{ dataUrl: string; width: number; height: number; x: number; y: number }> {
    return new Promise((resolve, reject) => {
        try {
            // 1. Measure "Real" Content dimensions from the DOM
            // This captures elements that might overflow the default viewBox (like top labels)
            const bbox = (svgElement as SVGSVGElement).getBBox();

            // Add safe padding
            const padding = 20;
            const x = bbox.x - padding;
            const y = bbox.y - padding;
            const width = bbox.width + (padding * 2);
            const height = bbox.height + (padding * 2);

            // 2. Clone and Sanitize
            const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
            sanitizeSvg(clonedSvg);

            // 3. Update ViewBox to fit the REAL content
            clonedSvg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);

            // CRITICAL: Set the SVG dimensions to the TARGET high-res size.
            // This forces the browser to rasterize vectors at the scaled resolution.
            // If we just set width/height to original size and scale the canvas, 
            // some browsers might rasterize at low-res and then upscale.
            const scale = 6; // 6x resolution (~600 DPI)
            const targetWidth = width * scale;
            const targetHeight = height * scale;

            clonedSvg.setAttribute('width', targetWidth.toString());
            clonedSvg.setAttribute('height', targetHeight.toString());

            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            const cleanup = () => {
                clearTimeout(timeoutId);
                URL.revokeObjectURL(url);
            };

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error("Timeout generating chart image"));
            }, 5000);

            img.onload = () => {
                cleanup();
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas Context failed"));
                    return;
                }

                // Enable anti-aliasing for better results
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // No ctx.scale needed here because the image is ALREADY high-res
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                const pngUrl = canvas.toDataURL('image/png');

                // Return data + the spatial adjustments needed to align it
                // We return the ORIGINAL dimensions for layout calculation, but the image itself is high-res.
                resolve({
                    dataUrl: pngUrl,
                    width, // Logic uses original mm dimensions
                    height,
                    x,
                    y
                });
            };

            img.onerror = (e) => {
                cleanup();
                reject(e);
            };

            img.src = url;
        } catch (e) {
            reject(e);
        }
    });
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

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
        toast.error("Erro ao ler dados do gráfico.");
        return;
    }

    try {
        // For simple export, we rely on the measured dimensions from generateChartImage
        const { dataUrl } = await generateChartImage(svgElement);

        const link = document.createElement('a');
        link.download = `chart-${chartId}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Gráfico exportado!");
    } catch (e) {
        console.error('Export failed', e);
        toast.error("Falha na exportação.");
    }
}
