import { create } from 'zustand';

interface UIState {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    toastMessage: string | null;
    setToastMessage: (message: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
    theme: 'light',
    setTheme: (theme) => set({ theme }),
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    toastMessage: null,
    setToastMessage: (toastMessage) => set({ toastMessage }),
}));
