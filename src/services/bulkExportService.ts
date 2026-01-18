import JSZip from 'jszip';
import { Project, Chart } from '@/types';
import { generateChartImage } from '@/utils/exportUtils';
import { logger } from "@/utils/logger";

interface ExportFile {
    name: string;
    blob: Blob;
    folder?: string;
}

export const bulkExportService = {
    /**
     * Groups charts by chatper based on project structure.
     */
    organizeChartsByChapter: (project: Project, charts: Chart[]): Map<string, Chart[]> => {
        const map = new Map<string, Chart[]>();
        const chapters = project.chapters || [];
        const sortedChapters = [...chapters].sort((a, b) => a.startPage - b.startPage);
        const totalPages = project.totalPages || 1;

        // Helper to find chapter for a page
        const getChapterForPage = (page: number): string => {
            // Check if before first chapter
            if (sortedChapters.length > 0 && page < sortedChapters[0].startPage) {
                return "00 - Intro";
            }
            if (sortedChapters.length === 0) {
                return "00 - Geral";
            }

            for (let i = 0; i < sortedChapters.length; i++) {
                const chapter = sortedChapters[i];
                const nextChapter = sortedChapters[i + 1];

                if (page >= chapter.startPage) {
                    if (!nextChapter || page < nextChapter.startPage) {
                        return `${(i + 1).toString().padStart(2, '0')} - ${chapter.title}`;
                    }
                }
            }
            // Should not reach here if logic covers all, but fallback
            return "99 - Outros";
        };

        charts.forEach(chart => {
            const page = chart.page || 1;
            const chapterName = getChapterForPage(page);

            const list = map.get(chapterName) || [];
            list.push(chart);
            map.set(chapterName, list);
        });

        return map;
    },

    /**
     * Creates a ZIP file from a list of files/blobs.
     */
    createZip: async (files: ExportFile[]): Promise<Blob> => {
        const zip = new JSZip();

        files.forEach(file => {
            if (file.folder) {
                zip.folder(file.folder)?.file(file.name, file.blob);
            } else {
                zip.file(file.name, file.blob);
            }
        });

        return await zip.generateAsync({ type: 'blob' });
    }
};
