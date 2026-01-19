import { useState, useEffect } from 'react';
import { Project, Chart } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { bulkExportService } from '@/services/bulkExportService';
import { generateChartImage } from '@/utils/exportUtils';
import { saveAs } from 'file-saver';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

export function useBulkExport(project: Project) {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentAction, setCurrentAction] = useState('');
    const { setActivePage, activePage } = useEditorStore();
    const [exportQueue, setExportQueue] = useState<{ chart: Chart; folder: string; width: number; height: number }[]>([]);
    const [readyCharts, setReadyCharts] = useState<Set<string>>(new Set());
    const [exportScope, setExportScope] = useState<{ type: 'project' } | { type: 'chapter', chapterIndex: number, chapterTitle: string } | null>(null);
    const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
    const [isCapturing, setIsCapturing] = useState(false);

    // Derived dimensions for the current chart
    const getChartDimensions = (chart: Chart) => {
        // Reuse logic from Canvas.tsx (simplified) to get pixel size
        const PIXELS_PER_MM = 3.78;
        const formatBaseW = project.gridConfig.pageFormat === 'A3' ? 297 : (project.gridConfig.pageFormat === 'A5' ? 148 : 210);
        const formatBaseH = project.gridConfig.pageFormat === 'A3' ? 420 : (project.gridConfig.pageFormat === 'A5' ? 210 : 297);
        const isLandscape = project.gridConfig.orientation === 'landscape';
        const PAGE_WIDTH_MM = isLandscape ? Math.max(formatBaseW, formatBaseH) : Math.min(formatBaseW, formatBaseH);
        const PAGE_HEIGHT_MM = isLandscape ? Math.min(formatBaseW, formatBaseH) : Math.max(formatBaseW, formatBaseH);
        const widthPx = PAGE_WIDTH_MM * PIXELS_PER_MM;
        const heightPx = PAGE_HEIGHT_MM * PIXELS_PER_MM;
        const { columns, rows, margin, gutter } = project.gridConfig;
        const marginPx = margin * PIXELS_PER_MM;
        const gutterPx = gutter * PIXELS_PER_MM;

        let moduleWidth: number;
        let moduleHeight: number;

        if (project.gridConfig.mode === 'fixed' && project.gridConfig.fixedModuleWidth && project.gridConfig.fixedModuleHeight) {
            moduleWidth = project.gridConfig.fixedModuleWidth * PIXELS_PER_MM;
            moduleHeight = project.gridConfig.fixedModuleHeight * PIXELS_PER_MM;
        } else {
            const availableWidth = widthPx - (2 * marginPx) - ((columns - 1) * gutterPx);
            moduleWidth = availableWidth / columns;
            const availableHeight = heightPx - (2 * marginPx) - ((rows - 1) * gutterPx);
            moduleHeight = availableHeight / rows;
        }

        const w = chart.module.w * moduleWidth + (chart.module.w - 1) * gutterPx;
        const h = chart.module.h * moduleHeight + (chart.module.h - 1) * gutterPx;

        return { width: w, height: h };
    };


    const startBulkExport = async (scope: { type: 'project' } | { type: 'chapter', chapterIndex: number, chapterTitle: string }, format: 'png' | 'pdf' = 'png') => {
        if (isExporting) return;

        setIsExporting(true);
        setIsCapturing(false);
        setProgress(0);
        setCurrentAction('Inicializando...');
        setExportScope(scope);
        setExportFormat(format);
        setReadyCharts(new Set()); // Reset ready set
        setExportQueue([]);

        try {
            setCurrentAction('Carregando dados dos gráficos...');

            const { chartService } = await import('@/services/chartService');
            const allCharts = await chartService.getProjectCharts(project.id);

            // FILTER CHARTS
            let chartsToExport: Chart[] = allCharts;

            if (scope.type === 'chapter') {
                const chapters = project.chapters || [];
                const sortedChapters = [...chapters].sort((a, b) => a.startPage - b.startPage);
                const targetChapter = sortedChapters[scope.chapterIndex];

                if (!targetChapter) {
                    toast.error("Capítulo não encontrado.");
                    setIsExporting(false);
                    return;
                }

                const nextChapter = sortedChapters[scope.chapterIndex + 1];
                const startPage = targetChapter.startPage;
                const endPage = nextChapter ? nextChapter.startPage - 1 : (project.totalPages || 9999);

                chartsToExport = allCharts.filter(c => {
                    const page = c.page || 1;
                    return page >= startPage && page <= endPage;
                });
            }

            if (chartsToExport.length === 0) {
                toast.error("Nenhum gráfico encontrado.");
                setIsExporting(false);
                return;
            }

            // BUILD QUEUE WITH DIMENSIONS PRE-CALCULATED
            const chapterMap = bulkExportService.organizeChartsByChapter(project, chartsToExport);
            const queue: { chart: Chart; folder: string; width: number; height: number }[] = [];

            chapterMap.forEach((chapterCharts, chapterName) => {
                chapterCharts.forEach(chart => {
                    const dims = getChartDimensions(chart);
                    queue.push({
                        chart,
                        folder: chapterName,
                        width: dims.width,
                        height: dims.height
                    });
                });
            });

            logger.log(`[Bulk] Queue built with ${queue.length} items. Rendering all off-screen...`);
            setCurrentAction(`Renderizando ${queue.length} gráficos...`);

            // TRIGGER RENDER
            setExportQueue(queue);
            // The UI will now render all OffsetScreenChartRenderer components.
            // We wait for them effectively via handleChartReady callbacks.

        } catch (error) {
            logger.error('Error starting bulk export', error);
            setIsExporting(false);
            toast.error("Erro ao iniciar exportação.");
        }
    };

    // CALLBACK: Triggered by EACH chart when it is ready
    const handleChartReady = (chartId: string) => {
        setReadyCharts(prev => {
            const next = new Set(prev);
            next.add(chartId);
            return next;
        });
    };

    const finishExport = async (files: { name: string; blob: Blob; folder?: string }[]) => {
        setCurrentAction('Compactando arquivos (ZIP)...');
        try {
            if (files.length === 0) {
                toast.error("Nenhum arquivo gerado.");
            } else {
                const zipBlob = await bulkExportService.createZip(files);
                const scopeName = exportScope?.type === 'chapter' ? exportScope.chapterTitle : project.name;
                saveAs(zipBlob, `${scopeName.replace(/[^a-z0-9]/gi, '_')}_export_${exportFormat}.zip`);
                toast.success(`Exportação concluída! ${files.length} gráficos.`);
            }

        } catch (e) {
            logger.error("Error finalizing", e);
            toast.error("Falha ao finalizar exportação.");
        } finally {
            setIsExporting(false);
            setExportQueue([]);
            setReadyCharts(new Set());
            setIsCapturing(false);
            setExportScope(null);
        }
    };

    const processQueue = async () => {
        setIsCapturing(true);
        const total = exportQueue.length;
        logger.log(`[Bulk] All ${total} charts ready. Starting sequential capture...`);

        const files: { name: string; blob: Blob; folder?: string }[] = [];

        for (let i = 0; i < total; i++) {
            const item = exportQueue[i];
            const { chart, folder } = item;
            // Note: item.width/height are the MODULE dimensions, but we should use the GENERATED IMAGE dimensions for the file
            // to avoid flattening/stretching if the aspect ratios differ.

            setCurrentAction(`Capturando gráfico ${i + 1} de ${total} (${chart.name})...`);
            setProgress(Math.round(((i + 1) / total) * 100));

            // Small delay to let UI update status
            await new Promise(r => setTimeout(r, 100));

            // Capture ID based on convention in BulkExportProgressModal
            const containerId = `headless-chart-${chart.id}`;
            const container = document.getElementById(containerId);
            const svgElement = container?.querySelector('svg');

            if (svgElement) {
                try {
                    // Generate image using exportUtils
                    // This returns the ACTUAL dimensions of the chart content (plus padding)
                    const imageResult = await generateChartImage(svgElement as SVGElement);
                    const { dataUrl, width: localImgW, height: localImgH } = imageResult;

                    if (dataUrl && dataUrl.length > 100) {
                        let blob: Blob;
                        let extension: string;

                        if (exportFormat === 'pdf') {
                            const { jsPDF } = await import('jspdf');
                            // Use the IMAGE dimensions for the PDF page to preserve aspect ratio
                            const pdf = new jsPDF({
                                orientation: localImgW > localImgH ? 'landscape' : 'portrait',
                                unit: 'px',
                                format: [localImgW, localImgH]
                            });

                            // Use 'FAST' compression for maximum fidelity.
                            pdf.addImage(dataUrl, 'PNG', 0, 0, localImgW, localImgH, undefined, 'FAST');
                            blob = pdf.output('blob');
                            extension = 'pdf';
                        } else {
                            const res = await fetch(dataUrl);
                            blob = await res.blob();
                            extension = 'png';
                        }

                        const safeTitle = (chart.name || `chart-${chart.id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();

                        files.push({
                            name: `${safeTitle}.${extension}`,
                            blob: blob,
                            folder: exportScope?.type === 'chapter' ? undefined : folder
                        });

                        logger.log(`[Bulk] Captured ${chart.name} (${localImgW}x${localImgH})`);
                    } else {
                        logger.warn(`[Bulk] Empty image data for ${chart.name}`);
                    }
                } catch (err) {
                    logger.error(`[Bulk] Error capturing ${chart.name}`, err);
                }
            } else {
                logger.error(`[Bulk] DOM Element not found for ${chart.name} (${containerId})`);
            }
        }

        // FINISH
        await finishExport(files);
    };

    // EFFECT: Watch when all charts are ready
    // We use a useEffect to trigger the capture sequence ONCE
    useEffect(() => {
        // Condition:
        // 1. Queue is not empty
        // 2. We are NOT already capturing
        // 3. All charts in queue have reported "ready"
        if (exportQueue.length > 0 && !isCapturing && readyCharts.size === exportQueue.length) {
            console.log('[Bulk] All charts ready. Triggering capture sequence...');
            processQueue();
        }
    }, [readyCharts, exportQueue, isCapturing]);

    return {
        isExporting,
        progress,
        currentAction,
        startBulkExport,
        exportQueue,
        handleChartReady
    };
}
