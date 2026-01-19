import { db } from "@/config/firebase";
import { Chart } from "@/types";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

const COLLECTION_NAME = "charts";

export const chartService = {
    createChart: async (projectId: string, data: Omit<Chart, "id" | "projectId" | "createdAt" | "updatedAt" | "userId">): Promise<Chart> => {
        const timestamp = Date.now();
        const { auth } = await import('@/config/firebase');
        const userId = auth.currentUser?.uid;

        if (!userId) throw new Error("User must be logged in to create a chart");

        // Ensure page is set, defaulting to 1 if missing (for legacy or safety)
        const chartData = { ...data, page: data.page || 1 };

        const cleanData = JSON.parse(JSON.stringify({
            ...chartData,
            projectId,
            userId,
            createdAt: timestamp,
            updatedAt: timestamp,
        }));

        const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
        return { id: docRef.id, projectId, userId, ...chartData, createdAt: timestamp, updatedAt: timestamp } as Chart;
    },

    getProjectCharts: async (projectId: string): Promise<Chart[]> => {
        const { auth } = await import('@/config/firebase');
        const userId = auth.currentUser?.uid;
        if (!userId) return [];

        const q = query(collection(db, COLLECTION_NAME), where("projectId", "==", projectId), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Chart));
    },

    updateChart: async (id: string, data: Partial<Omit<Chart, "id" | "projectId" | "createdAt">>): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const cleanData = JSON.parse(JSON.stringify({
            ...data,
            updatedAt: Date.now()
        }));
        await updateDoc(docRef, cleanData);
    },

    deleteChart: async (id: string): Promise<void> => {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    },

    deleteChartsOnPage: async (projectId: string, page: number): Promise<void> => {
        const { auth, db } = await import('@/config/firebase');
        const { writeBatch } = await import('firebase/firestore');
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const q = query(
            collection(db, COLLECTION_NAME),
            where("projectId", "==", projectId),
            where("userId", "==", userId),
            where("page", "==", page)
        );
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    },

    shiftChartsAfterPage: async (projectId: string, thresholdPage: number): Promise<void> => {
        const { auth, db } = await import('@/config/firebase');
        const { writeBatch } = await import('firebase/firestore');
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // Firestore doesn't support '>', so we fetch all project charts and filter, or use simple query if index exists
        // Given we might not have composite index on (projectId, userId, page), fetching all project charts is safer/easier for now
        // Or we can try query with 'page' > thresholdPage if we trust the index.
        // Let's fetch all (usually < 100 charts/project) and filter in memory to be safe against index errors.

        const q = query(collection(db, COLLECTION_NAME), where("projectId", "==", projectId), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        let hasUpdates = false;

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.page > thresholdPage) {
                batch.update(doc.ref, { page: data.page - 1 });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            await batch.commit();
        }
    }
};
