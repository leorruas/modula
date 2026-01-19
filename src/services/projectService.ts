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
                .filter(c => c.startPage !== pageToDelete) // Remove chapter if it starts exactly on this page (User decision: Simple Remove for now)
                // OR: strictly, we might want to keep the chapter but move it? 
                // Let's assume: If you delete the start page of a chapter, the chapter marker is removed (as per business rules "Remover Apenas Capítulo" logic variant, but here forced).
                // Better: If a chapter starts on a later page, shift its startPage down.
                .map(c => {
                    if (c.startPage > pageToDelete) {
                        return { ...c, startPage: c.startPage - 1 };
                    }
                    return c;
                });
        }

        await projectService.updateProject(projectId, updates);
    }
};
