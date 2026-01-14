
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import { Project, Chart } from '@/types';

// Extend jsPDF type was causing conflicts. Assuming loaded types are sufficient or we cast.


export class PDFExportService {
    static async exportProject(project: Project, charts: Chart[], canvasRef: HTMLDivElement): Promise<void> {
        // Create a new PDF document
        const orientation = project.gridConfig.orientation;
        const format = project.gridConfig.pageFormat === 'Custom' ? 'a4' : project.gridConfig.pageFormat.toLowerCase();

        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: format === 'custom' ? 'a4' : format
        });

        // Get the SVG element from the canvas
        const PIXELS_PER_MM = 3.78; // Approx for 96 DPI
        const widthMm = doc.internal.pageSize.getWidth();
        const heightMm = doc.internal.pageSize.getHeight();

        // Create master SVG
        const masterSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        masterSvg.setAttribute("width", String(widthMm * PIXELS_PER_MM));
        masterSvg.setAttribute("height", String(heightMm * PIXELS_PER_MM));
        masterSvg.setAttribute("viewBox", `0 0 ${widthMm * PIXELS_PER_MM} ${heightMm * PIXELS_PER_MM}`);

        // 1. Add Grid
        // Locate Grid SVG in DOM: It's the first child of the transform container (which IS the canvasRef passed)
        const transformContainer = canvasRef;
        const gridSvg = transformContainer.children[0] as SVGElement;

        // Ensure it is actually an SVG (GridSystem returns svg)
        if (gridSvg && gridSvg.tagName.toLowerCase() === 'svg') {
            const clonedGrid = gridSvg.cloneNode(true) as SVGElement;
            masterSvg.appendChild(clonedGrid);
        }

        // 2. Add Charts
        // Locate all charts. They are adjacent siblings to the Grid SVG
        const chartDivs = Array.from(transformContainer.children).slice(1) as HTMLElement[];

        chartDivs.forEach((div) => {
            const svg = div.querySelector('svg');
            if (svg) {
                const x = parseFloat(div.style.left || '0');
                const y = parseFloat(div.style.top || '0');
                const w = parseFloat(div.style.width || '0');
                const h = parseFloat(div.style.height || '0');

                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                g.setAttribute("transform", `translate(${x}, ${y})`);

                const clonedChart = svg.cloneNode(true) as SVGElement;
                // Ensure width/height are set on the SVG if not already explicit
                clonedChart.setAttribute("width", String(w));
                clonedChart.setAttribute("height", String(h));

                g.appendChild(clonedChart);
                masterSvg.appendChild(g);
            }
        });

        // Convert to PDF
        // We need to attach masterSvg to DOM briefly for svg2pdf to work properly
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.appendChild(masterSvg);
        document.body.appendChild(tempContainer);

        await svg2pdf(masterSvg, doc, {
            x: 0,
            y: 0,
            width: widthMm,
            height: heightMm
        });

        document.body.removeChild(tempContainer);

        // Determine Filename
        let filename = project.name;

        if (charts.length > 0 && project.useChapters && project.chapters) {
            const pageNum = charts[0].page || 1;
            const currentChapter = project.chapters.slice().reverse().find(c => c.startPage <= pageNum);

            if (currentChapter) {
                filename = `${currentChapter.startPage}. ${currentChapter.title}`;
            }
        }

        doc.save(`${filename}.pdf`);

        await this.logExportEvent(project.id, project.name);
    }

    private static async logExportEvent(projectId: string, projectName: string) {
        try {
            const { db, auth } = await import('@/config/firebase');
            const { collection, addDoc } = await import('firebase/firestore');

            if (!auth.currentUser) return;

            await addDoc(collection(db, 'export_events'), {
                projectId,
                projectName,
                userId: auth.currentUser.uid,
                timestamp: Date.now(),
                format: 'pdf',
                status: 'success'
            });
        } catch (error) {
            console.error('Failed to log export event', error);
        }
    }
}
