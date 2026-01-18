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
            clonedSvg.setAttribute('width', width.toString());
            clonedSvg.setAttribute('height', height.toString());

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
                // 3x resolution for high-quality print PDF
                const scale = 3;
                canvas.width = width * scale;
                canvas.height = height * scale;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas Context failed"));
                    return;
                }

                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, width, height);

                const pngUrl = canvas.toDataURL('image/png');

                // Return data + the spatial adjustments needed to align it
                resolve({
                    dataUrl: pngUrl,
                    width,
                    height,
                    x, // The offset we shifted the viewbox by
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
