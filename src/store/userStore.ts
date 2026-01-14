import { create } from 'zustand';
import { User } from 'firebase/auth';

interface UserState {
    user: User | null;
    setUser: (user: User | null) => void;
    isAuthReady: boolean;
    setAuthReady: (ready: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    isAuthReady: false,
    setAuthReady: (isAuthReady) => set({ isAuthReady }),
}));
