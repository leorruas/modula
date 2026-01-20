
import jsPDF from 'jspdf';
import { Project, Chart } from '@/types';


export class PDFExportService {
    static async exportProject(project: Project, charts: Chart[], canvasRef: HTMLDivElement): Promise<void> {
        // Create a new PDF document
        const orientation = project.gridConfig.orientation;
        const pageFormat = project.gridConfig.pageFormat;

        let format: string | number[] = 'a4';

        if (pageFormat === 'Custom') {
            // Use exact custom dimensions from config (in mm)
            // Ensure we pass [width, height] regardless of orientation setting in jsPDF, 
            // as jsPDF handles orientation swapping internally if 'landscape' is set. 
            // However, passing specific numbers usually implies the page size *in that orientation*.
            // Safest: pass [width, height] matching the orientation? 
            // Actually, for custom, we can just pass [width, height] as units.
            format = [project.gridConfig.width, project.gridConfig.height];
        } else {
            format = pageFormat.toLowerCase();
        }

        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: format
        });

        // SAFETY NET: Set Default Font to Helvetica globally
        doc.setFont('Helvetica');

        // Get the SVG element from the canvas
        // DYNAMIC SCALING STRATEGY:
        // Instead of assuming 96 DPI (3.78 px/mm), we calculate the ratio between
        // the PDF page width (in mm) and the actual DOM container width (in pixels).
        // This ensures that whatever is seen on screen fills the PDF page proportionally.
        const widthMm = doc.internal.pageSize.getWidth();
        const heightMm = doc.internal.pageSize.getHeight();

        const domWidth = canvasRef.offsetWidth;
        // Safety check to avoid division by zero
        const scaleFactor = domWidth > 0 ? widthMm / domWidth : 3.78;

        // 2. Add Charts
        // Data-Driven Approach: Iterate over the charts data to find their corresponding DOM elements.
        // We use the "Rasterization Strategy" here: Convert DOM (Container) to High-Resolution PNG -> Add to PDF.
        // html-to-image handles font embedding and style cloning.
        const { generateChartImage } = await import('@/utils/exportUtils');

        for (const chart of charts) {
            const containerId = `chart-container-${chart.id}`;
            const child = document.getElementById(containerId);

            if (child) {
                // Ensure we get the container, not just the SVG, to capture full context
                // child IS the container (div id=chart-container-...)

                // Use offsetWidth/Height for accurate unscaled dimensions (pixels)
                // getBoundingClientRect is affected by zoom, which breaks PDF sizing/positioning
                // Use offsetWidth/Height for accurate unscaled dimensions (pixels)
                // getBoundingClientRect is affected by zoom, which breaks PDF sizing/positioning
                const x = child.offsetLeft;
                const y = child.offsetTop;
                const w = child.offsetWidth;
                const h = child.offsetHeight;

                try {
                    console.log(`Processing chart ${chart.id} for PDF (Raster)...`);

                    // RASTER STRATEGY: Use html-to-image to get high-res PNG
                    // This is more robust for gradients, web fonts, and glass effects.
                    const { dataUrl } = await generateChartImage(child as HTMLElement, {
                        // backgroundColor: '#fdfbf7', // REMOVED: Use transparent background to match editor
                        pixelRatio: 6, // Ultra High resolution (approx 600 DPI)
                        padding: 0 // NO PADDING for PDF to ensure exact sizing/positioning
                    });

                    const safeX = isNaN(x) ? 0 : x;
                    const safeY = isNaN(y) ? 0 : y;

                    // Convert screen pixels to PDF units (mm) using dynamic scaleFactor
                    const xMm = safeX * scaleFactor;
                    const yMm = safeY * scaleFactor;
                    const wMm = w * scaleFactor;
                    const hMm = h * scaleFactor;

                    if (isNaN(xMm) || isNaN(yMm) || isNaN(wMm) || isNaN(hMm)) {
                        console.error(`Calculated invalid PDF coordinates for chart ${chart.id}`, { xMm, yMm, wMm, hMm });
                        continue;
                    }

                    // Add PNG to PDF with FAST compression (balances size/speed, good for PNGs)
                    doc.addImage(dataUrl, 'PNG', xMm, yMm, wMm, hMm, undefined, 'FAST');

                    console.log(`Added raster chart to PDF at ${xMm}, ${yMm} (${wMm}x${hMm}mm)`);

                } catch (e) {
                    console.error(`Failed to export raster chart ${chart.id}`, e);
                }
            }
        }

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
