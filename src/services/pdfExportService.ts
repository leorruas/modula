
import jsPDF from 'jspdf';
import { Project, Chart } from '@/types';


export class PDFExportService {
    static async exportProject(project: Project, charts: Chart[], canvasRef: HTMLDivElement, activePage?: number): Promise<void> {
        // Create a new PDF document
        const orientation = project.gridConfig.orientation;
        const pageFormat = project.gridConfig.pageFormat;

        let format: string | number[] = 'a4';

        if (pageFormat === 'Custom') {
            // Use exact custom dimensions from config (in mm)
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
                    console.log(`Processing chart ${chart.id} for PDF. Absolute Pos: ${x}, ${y}`);

                    // Wait for layout/rendering/animations to stabilize
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const PADDING_PX = 40; // Capture buffer for visual overflow (labels, shadows)

                    const isTreemap = chart.type === 'treemap';
                    const hasSvg = child.querySelector('svg');

                    // Calculate Base Coordinates (Screen -> PDF)
                    const safeX = isNaN(x) ? 0 : x;
                    const safeY = isNaN(y) ? 0 : y;

                    // The visual content is padded by PADDING_PX in the raster/vector generation
                    // So we must offset the PDF placement by the scaled padding to align the "content box"
                    const paddingScaledMm = PADDING_PX * scaleFactor;
                    const xMm = (safeX * scaleFactor) - paddingScaledMm;
                    const yMm = (safeY * scaleFactor) - paddingScaledMm;

                    // VECTOR STRATEGY: Treemaps (to fix White Screen)
                    if (isTreemap && hasSvg) {
                        const { exportSvgToPdf } = await import('@/utils/exportUtils');
                        // For vector, we don't need the padding offset logic as we render the SVG rect directly?
                        // Actually, we want to match the visual footprint.
                        // Let's assume the SVG fills the container.
                        // We use the simpler x/y/w/h of the container converted to mm.

                        const vecX = safeX * scaleFactor;
                        const vecY = safeY * scaleFactor;
                        const vecW = (child.offsetWidth || 100) * scaleFactor;
                        const vecH = (child.offsetHeight || 100) * scaleFactor;

                        console.log(`Exporting Treemap ${chart.id} as Vector at ${vecX},${vecY} (${vecW}x${vecH}mm)`);
                        await exportSvgToPdf(hasSvg, doc, vecX, vecY, vecW, vecH);

                        console.log(`Added vector chart ${chart.id} to PDF`);
                        continue; // Skip raster fallback
                    }

                    // RASTER STRATEGY: html-to-image (Default for others)
                    // Note: Vector strategy (svg2pdf) is used for Treemap above.
                    // We reverted to Raster with a background-rect fix in TreemapChart to ensure correct fonts.
                    const result = await generateChartImage(child as HTMLElement, {
                        backgroundColor: '#ffffff',
                        pixelRatio: 3.5,
                        padding: PADDING_PX
                    });

                    if (!result || !result.dataUrl) {
                        console.error(`Export failure for chart ${chart.id}: Empty result from generateChartImage`);
                        continue;
                    }

                    const { dataUrl, width: capturedW, height: capturedH } = result;

                    // capturedW already includes padding from generateChartImage
                    const wMm = capturedW * scaleFactor;
                    const hMm = capturedH * scaleFactor;

                    if (isNaN(xMm) || isNaN(yMm) || isNaN(wMm) || isNaN(hMm)) {
                        console.error(`Calculated invalid PDF coordinates for raster chart ${chart.id}`, { xMm, yMm, wMm, hMm });
                        continue;
                    }

                    doc.addImage(dataUrl, 'PNG', xMm, yMm, wMm, hMm, undefined, 'FAST');
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
        const targetPage = activePage || 1;

        if (project.useChapters && project.chapters) {
            // Sort chapters by page (ascending) to safely find the range
            const sortedChapters = project.chapters.slice().sort((a, b) => a.startPage - b.startPage);

            // Find the chapter that contains the targetPage
            // A chapter starts at `startPage`. It covers everything until the next chapter's startPage.
            const currentChapter = sortedChapters.reverse().find(c => c.startPage <= targetPage);

            console.log('📄 PDF Filename Debug:', {
                targetPage,
                foundChapter: currentChapter?.title,
                chapterStart: currentChapter?.startPage
            });

            if (currentChapter) {
                // Determine 'Index' of the chart relative to the chapter or project?
                // User example: "34. 5.1". 
                // "34" looks like the PAGE number. "5.1" looks like "Chapter 5, Item 1".

                // Construct prefix: "{Page}. {ChapterTitle}"
                // If the user wants "34. 5.1...", we need to know if "5.1" is the chapter title or generated.
                // Assuming "5.1" is part of the Chapter Title (e.g. title="5.1 - Demografia").

                const chapterPrefix = `${targetPage}. ${currentChapter.title}`;

                // Find charts on this page to get a specific name
                const pageCharts = charts.filter(c => (c.page || 1) === targetPage);
                const chartName = pageCharts.length > 0 ? (pageCharts[0].name || "Gráfico") : "";

                filename = chartName ? `${chapterPrefix} - ${chartName}` : chapterPrefix;
            } else {
                // Fallback if before first chapter
                filename = `${targetPage}. ${filename}`;
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
