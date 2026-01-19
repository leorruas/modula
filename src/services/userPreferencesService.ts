import { db } from "@/config/firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserPreferences } from '@/types';

/**
 * User Preferences Service
 * Manages user-specific default preferences for charts
 * Stored in: /users/{userId}/preferences
 */

export const userPreferencesService = {
    /**
     * Save user preferences
     */
    async saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
        const userPrefRef = doc(db, 'users', userId, 'preferences', 'chartDefaults');
        await setDoc(userPrefRef, preferences, { merge: true });
    },

    /**
     * Get user preferences
     */
    async getUserPreferences(userId: string): Promise<UserPreferences | null> {
        const userPrefRef = doc(db, 'users', userId, 'preferences', 'chartDefaults');
        const docSnap = await getDoc(userPrefRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserPreferences;
        }
        return null;
    },

    /**
     * Clear user preferences
     */
    async clearUserPreferences(userId: string): Promise<void> {
        const userPrefRef = doc(db, 'users', userId, 'preferences', 'chartDefaults');
        await setDoc(userPrefRef, {});
    }
};
