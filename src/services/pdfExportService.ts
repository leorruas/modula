
import jsPDF from 'jspdf';
import { Project, Chart } from '@/types';
import { generateChartImage } from '@/utils/exportUtils';

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

        // SAFETY NET: Set Default Font to Helvetica globally
        doc.setFont('Helvetica');

        // Get the SVG element from the canvas
        const PIXELS_PER_MM = 3.78; // Approx for 96 DPI
        const widthMm = doc.internal.pageSize.getWidth();
        const heightMm = doc.internal.pageSize.getHeight();

        // 2. Add Charts
        // Data-Driven Approach: Iterate over the charts data to find their corresponding DOM elements.
        // We use the "Rasterization Strategy" here: Convert SVG to High-Resolution PNG -> Add to PDF.
        // The generateChartImage utility now uses a 6x scale, providing ~600 DPI for standard layouts.

        for (const chart of charts) {
            const containerId = `chart-container-${chart.id}`;
            const child = document.getElementById(containerId);

            if (child) {
                const svg = child.querySelector('svg');
                if (svg) {
                    const x = parseFloat(child.style.left || '0');
                    const y = parseFloat(child.style.top || '0');
                    const w = parseFloat(child.style.width || '0');
                    const h = parseFloat(child.style.height || '0');

                    try {
                        console.log(`Processing chart ${chart.id} for PDF...`);

                        // Generate High-Res PNG from the Chart SVG
                        // generateChartImage now measures the REAL bbox and returns the adjusted dimensions and offsets
                        const imageResult = await generateChartImage(svg);

                        // Validate Result
                        if (!imageResult || !imageResult.dataUrl) {
                            console.error(`Received invalid image result for chart ${chart.id}`, imageResult);
                            continue;
                        }

                        // Debug Logs
                        console.log(`Chart ${chart.id} Rasterized:`, {
                            originalPos: { x, y, w, h },
                            imageResultPos: {
                                x: imageResult.x,
                                y: imageResult.y,
                                w: imageResult.width,
                                h: imageResult.height
                            }
                        });

                        // Embed in PDF
                        // The imageResult.x and .y are negative offsets (usually) representing margin overflow.
                        // e.g. if x is -10, it means the content starts 10px to the left of the container.
                        // We need to shift the PDF placement by this amount to keep the visual center aligned.

                        // Handle NaN cases from parseFloat defaults
                        const safeX = isNaN(x) ? 0 : x;
                        const safeY = isNaN(y) ? 0 : y;

                        const xMm = (safeX + imageResult.x) / PIXELS_PER_MM;
                        const yMm = (safeY + imageResult.y) / PIXELS_PER_MM;
                        const wMm = imageResult.width / PIXELS_PER_MM;
                        const hMm = imageResult.height / PIXELS_PER_MM;

                        if (isNaN(xMm) || isNaN(yMm) || isNaN(wMm) || isNaN(hMm)) {
                            console.error(`Calculated invalid PDF coordinates for chart ${chart.id}`, { xMm, yMm, wMm, hMm });
                            continue;
                        }

                        // Use 'FAST' compression for PNGs to maintain quality while keeping file size manageable.
                        doc.addImage(imageResult.dataUrl, 'PNG', xMm, yMm, wMm, hMm, undefined, 'FAST');
                        console.log(`Added high-res image to PDF at ${xMm}, ${yMm} (${wMm}x${hMm}mm)`);

                    } catch (e) {
                        console.error(`Failed to rasterize chart ${chart.id}`, e);
                        // Fallback? No, if rasterization fails, better to show nothing than broken stuff.
                    }
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
