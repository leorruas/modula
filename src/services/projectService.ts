import { db } from "@/config/firebase";
import { Project } from "@/types";
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore";

const COLLECTION_NAME = "projects";

export const projectService = {
    createProject: async (userId: string, data: Omit<Project, "id" | "userId" | "createdAt" | "updatedAt">): Promise<Project> => {
        const timestamp = Date.now();

        // Remove undefined fields to avoid FirebaseError
        const cleanData = JSON.parse(JSON.stringify({
            ...data,
            userId,
            createdAt: timestamp,
            updatedAt: timestamp,
        }));

        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        return { id: docRef.id, userId, ...data, createdAt: timestamp, updatedAt: timestamp };
    },

    getUserProjects: async (userId: string): Promise<Project[]> => {
        const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
    },

    getProject: async (id: string): Promise<Project | null> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Project;
        } else {
            return null;
        }
    },

    updateProject: async (id: string, data: Partial<Omit<Project, "id" | "userId" | "createdAt">>): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const cleanData = JSON.parse(JSON.stringify({
            ...data,
            updatedAt: Date.now()
        }));
        await updateDoc(docRef, cleanData);
    },

    deleteProject: async (id: string): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    deletePage: async (projectId: string, pageToDelete: number, totalPages: number): Promise<void> => {
        const { chartService } = await import('./chartService');

        // 1. Delete all charts on this page
        await chartService.deleteChartsOnPage(projectId, pageToDelete);

        // 2. Shift all charts on subsequent pages (page > pageToDelete) down by 1
        await chartService.shiftChartsAfterPage(projectId, pageToDelete);

        // 3. Update project: decrement totalPages and adjust chapters
        const project = await projectService.getProject(projectId);
        if (!project) return;

        const updates: any = {
            totalPages: totalPages - 1
        };

        if (project.chapters) {
            updates.chapters = project.chapters
                .filter(c => c.startPage !== pageToDelete) // Remove chapter if it starts exactly on this page
                .map(c => {
                    if (c.startPage > pageToDelete) {
                        return { ...c, startPage: c.startPage - 1 };
                    }
                    return c;
                });
        }

        await projectService.updateProject(projectId, updates);
    },

    reorderChapters: async (projectId: string, newChapterOrder: number[]): Promise<void> => {
        // newChapterOrder is an array of original chapter indices in the new desired order.
        const project = await projectService.getProject(projectId);
        if (!project || !project.chapters || project.chapters.length === 0) return;
        const { chartService } = await import('./chartService');

        const chapters = project.chapters;
        // Sort original chapters by startPage to be sure of order
        const sortedOriginalChapters = [...chapters].sort((a, b) => a.startPage - b.startPage);
        const totalPages = project.totalPages || 0;

        // 1. Build Blocks of Pages
        interface Block {
            originalChapterIndex: number; // -1 for Intro
            originalPages: number[];
            title?: string;
        }

        const blocks: Block[] = [];

        // Check for Intro pages (before first chapter)
        const firstStart = sortedOriginalChapters.length > 0 ? sortedOriginalChapters[0].startPage : totalPages + 1;
        if (firstStart > 1) {
            const introPages = [];
            for (let i = 1; i < firstStart; i++) introPages.push(i);
            blocks.push({ originalChapterIndex: -1, originalPages: introPages, title: "Intro" });
        }

        // Chapter Blocks
        sortedOriginalChapters.forEach((chap, idx) => {
            const start = chap.startPage;
            const nextChap = sortedOriginalChapters[idx + 1];
            const end = nextChap ? nextChap.startPage - 1 : totalPages;

            const pages = [];
            for (let i = start; i <= end; i++) pages.push(i);

            blocks.push({ originalChapterIndex: idx, originalPages: pages, title: chap.title });
        });

        const introBlock = blocks.find(b => b.originalChapterIndex === -1);
        const chapterBlocks = blocks.filter(b => b.originalChapterIndex !== -1);

        const reorderedChapterBlocks = newChapterOrder.map(idx => chapterBlocks[idx]);

        const finalBlocks = introBlock ? [introBlock, ...reorderedChapterBlocks] : reorderedChapterBlocks;

        // 3. Create Mapping OldPage -> NewPage
        const pageMap: Record<number, number> = {};
        const newChaptersStruct: { title: string; startPage: number }[] = [];
        let currentPageCounter = 1;

        finalBlocks.forEach(block => {
            // If this is a real chapter, record its new start page
            if (block.originalChapterIndex !== -1 && block.title) {
                newChaptersStruct.push({
                    title: block.title,
                    startPage: currentPageCounter
                });
            }

            block.originalPages.forEach(oldPage => {
                pageMap[oldPage] = currentPageCounter;
                currentPageCounter++;
            });
        });

        // 4. Update Charts
        const allCharts = await chartService.getProjectCharts(projectId);
        const updatePromises = allCharts.map(chart => {
            const oldPage = chart.page || 1;
            const newPage = pageMap[oldPage];
            if (newPage && newPage !== oldPage) {
                return chartService.updateChart(chart.id, { page: newPage });
            }
            return Promise.resolve();
        });

        await Promise.all(updatePromises);

        // 5. Update Project Structure
        await projectService.updateProject(projectId, {
            chapters: newChaptersStruct
        });
    },

    movePage: async (projectId: string, fromPage: number, toPage: number): Promise<void> => {
        if (fromPage === toPage) return;

        const project = await projectService.getProject(projectId);
        if (!project) return;
        const { chartService } = await import('./chartService');

        const allCharts = await chartService.getProjectCharts(projectId);

        // 1. Update Charts
        const updatePromises = allCharts.map(chart => {
            const p = chart.page || 1;
            let newP = p;

            if (p === fromPage) {
                newP = toPage;
            } else if (fromPage < toPage) {
                if (p > fromPage && p <= toPage) {
                    newP = p - 1;
                }
            } else { // fromPage > toPage
                if (p >= toPage && p < fromPage) {
                    newP = p + 1;
                }
            }

            if (newP !== p) {
                return chartService.updateChart(chart.id, { page: newP });
            }
            return Promise.resolve();
        });

        await Promise.all(updatePromises);

        // 2. Update Chapter Start Pages
        const updates: any = {};

        if (project.chapters) {
            const newChapters = project.chapters.map(c => {
                let s = c.startPage;
                if (fromPage < toPage) {
                    if (s > fromPage && s <= toPage) s--;
                } else if (fromPage > toPage) {
                    if (s >= toPage && s < fromPage) s++;
                }
                return { ...c, startPage: s };
            });

            updates.chapters = newChapters;
        }

        await projectService.updateProject(projectId, updates);
    }
};
