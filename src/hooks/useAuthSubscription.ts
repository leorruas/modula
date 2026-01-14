import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useUserStore } from '@/store/userStore';

export function useAuthSubscription() {
    const { setUser, setAuthReady } = useUserStore();

    useEffect(() => {
        let unsubscribe: () => void;
        try {
            unsubscribe = onAuthStateChanged(auth, (user) => {
                setUser(user);
                setAuthReady(true);
            });
        } catch (error) {
            console.warn("Firebase Auth failed to initialize (check .env.local):", error);
            setAuthReady(true); // Allow app to render in "guest" mode or error state
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [setUser, setAuthReady]);
}
