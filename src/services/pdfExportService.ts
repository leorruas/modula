
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

                // POSITION FIX: Calculate offset relative to the Canvas Root (canvasRef)
                // offsetLeft/Top are relative to *offsetParent*, which might be a nested Grid container.
                // We need the position relative to the Canvas (which maps to the PDF Page).
                let currentEl = child as HTMLElement;
                let x = 0;
                let y = 0;

                // Traverse up until we hit the canvasRef or null
                while (currentEl && currentEl !== canvasRef && canvasRef.contains(currentEl)) {
                    x += currentEl.offsetLeft;
                    y += currentEl.offsetTop;
                    currentEl = currentEl.offsetParent as HTMLElement;
                }

                // If not found in canvasRef hierarchy (weird), fall back to direct offset
                if (currentEl !== canvasRef && child.offsetLeft) {
                    x = child.offsetLeft;
                    y = child.offsetTop;
                }

                // We will use the captured dimensions from result later to avoid squishing

                try {
                    console.log(`Processing chart ${chart.id} for PDF (Raster). Absolute Pos: ${x}, ${y}`);

                    // Wait a tiny bit for any layout/rendering to stabilize
                    await new Promise(resolve => setTimeout(resolve, 50));

                    // RASTER STRATEGY: Use html-to-image to get high-res PNG
                    // pixelRatio reduced from 6 to 3.5 to stay within canvas memory limits while maintaining high quality.
                    const PADDING = 40; // Capture buffer for visual overflow (labels, shadows)
                    const result = await generateChartImage(child as HTMLElement, {
                        backgroundColor: '#ffffff', // Ensure white background for PDF rasterization
                        pixelRatio: 3.5,
                        padding: PADDING
                    });

                    if (!result || !result.dataUrl) {
                        console.error(`Export failure for chart ${chart.id}: Empty result from generateChartImage`);
                        continue;
                    }

                    const { dataUrl, width: capturedW, height: capturedH } = result;

                    const safeX = isNaN(x) ? 0 : x;
                    const safeY = isNaN(y) ? 0 : y;

                    // Convert screen pixels to PDF units (mm) using dynamic scaleFactor
                    // Convert screen pixels to PDF units (mm) using dynamic scaleFactor
                    // POSITION CORRECTION: Subtract scaled padding to align visual content to original (x,y)
                    const paddingScaledMm = PADDING * scaleFactor;
                    const xMm = (safeX * scaleFactor) - paddingScaledMm;
                    const yMm = (safeY * scaleFactor) - paddingScaledMm;

                    const wMm = capturedW * scaleFactor; // Captured Dimensions (Fixed Squishing)
                    const hMm = capturedH * scaleFactor;

                    if (isNaN(xMm) || isNaN(yMm) || isNaN(wMm) || isNaN(hMm)) {
                        console.error(`Calculated invalid PDF coordinates for chart ${chart.id}`, { xMm, yMm, wMm, hMm });
                        continue;
                    }

                    // Add High-Res PNG to PDF
                    // We use FAST compression to balance speed/quality for these large PNGs.
                    doc.addImage(dataUrl, 'PNG', xMm, yMm, wMm, hMm, undefined, 'FAST');
                    console.log(`Added raster chart ${chart.id} to PDF at ${xMm}, ${yMm} (${wMm}x${hMm}mm)`);

                    console.log(`Added raster chart ${chart.id} to PDF at ${xMm}, ${yMm} (${wMm}x${hMm}mm)`);

                } catch (e) {
                    console.error(`CRITICAL: Failed to add chart ${chart.id} to PDF.`, e);
                }
            } else {
                console.warn(`Chart container ${containerId} not found in DOM during PDF export.`);
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
