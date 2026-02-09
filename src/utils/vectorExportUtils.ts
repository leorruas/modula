import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";

/**
 * Exports an SVG element directly to a PDF document using vector commands.
 * This provides superior quality (infinite scaling) and reliable rendering of filters/gradients
 * compared to rasterization (html-to-image).
 * 
 * @param doc The jsPDF document instance
 * @param element The SVG DOM element to export
 * @param x X position in PDF units (usually mm)
 * @param y Y position in PDF units (usually mm)
 * @param width Target width in PDF units
 * @param height Target height in PDF units
 */
export async function exportSvgToPdf(
    doc: jsPDF,
    element: HTMLElement,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<void> {
    // 1. Ensure element is an SVG
    let svgElement: Element = element;

    // If it's a wrapper, find the SVG inside
    if (element.tagName.toLowerCase() !== 'svg') {
        const foundSvg = element.querySelector('svg');
        if (foundSvg) {
            svgElement = foundSvg;
        } else {
            console.warn("Vector Export: Supplied element is not an SVG and contains no SVG. Falling back might happen.");
            return;
        }
    }

    // 2. Clone the SVG to avoid mutating the DOM and to apply style overrides
    const clone = svgElement.cloneNode(true) as SVGElement;

    // FONT FIX: Force standard PDF fonts (Helvetica) to prevent Times New Roman fallback
    // svg2pdf defaults to Times if the font-family is not registered in jsPDF.
    // Since we don't have 'Inter' loaded in jsPDF, we map everything to Helvetica.

    // 1. Force on Root (for inheritance)
    clone.style.fontFamily = 'Helvetica';
    clone.setAttribute('font-family', 'Helvetica');

    // 2. Aggressively override all text elements to defeat CSS classes
    const textElements = clone.querySelectorAll('text, tspan');
    textElements.forEach((el) => {
        if (el instanceof SVGElement || el instanceof HTMLElement) {
            el.style.fontFamily = 'Helvetica';
            el.setAttribute('font-family', 'Helvetica');
            // Remove dominant-baseline if causing issues
            // el.removeAttribute('dominant-baseline');
        }
    });

    try {
        // 3. Prepare Options
        // render the SVG clone into the PDF context
        await svg2pdf(clone, doc, {
            x,
            y,
            width,
            height,
        });

        console.log("Vector Export Success");
    } catch (error) {
        console.error("Vector Export Failed", error);
        throw error;
    }
}
