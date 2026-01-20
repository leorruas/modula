import { create } from 'zustand';

interface EditorState {
    selectedModules: { r: number, c: number }[];
    startSelection: { r: number, c: number } | null;
    isSelecting: boolean;
    refreshTrigger: number;
    isPreviewMode: boolean; // Replaces editorMode
    activePage: number;
    editingChartId: string | null;
    searchQuery: string;
    highlightChartId: string | null;
    isChapterViewOpen: boolean;
    setActivePage: (page: number) => void;
    setEditingChartId: (id: string | null) => void;
    setSearchQuery: (query: string) => void;
    setHighlightChartId: (id: string | null) => void;
    setSelection: (modules: { r: number, c: number }[]) => void;
    setStartSelection: (start: { r: number, c: number } | null) => void;
    setIsSelecting: (isSelecting: boolean) => void;
    triggerRefresh: () => void;
    setIsPreviewMode: (isPreview: boolean) => void; // New setter
    setIsChapterViewOpen: (isOpen: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    selectedModules: [],
    startSelection: null,
    isSelecting: false,
    refreshTrigger: 0,
    isPreviewMode: false,
    activePage: 1,
    editingChartId: null,
    searchQuery: '',
    highlightChartId: null,
    isChapterViewOpen: false,
    setSelection: (selectedModules) => set({ selectedModules }),
    setStartSelection: (startSelection) => set({ startSelection }),
    setIsSelecting: (isSelecting) => set({ isSelecting }),
    triggerRefresh: () => set(state => ({ refreshTrigger: state.refreshTrigger + 1 })),
    setIsPreviewMode: (isPreviewMode) => set({ isPreviewMode }),
    setActivePage: (activePage) => set({ activePage, selectedModules: [], editingChartId: null, isChapterViewOpen: false }), // Close chapter view on navigation
    setEditingChartId: (editingChartId) => set({ editingChartId, selectedModules: [] }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setHighlightChartId: (highlightChartId) => set({ highlightChartId }),
    setIsChapterViewOpen: (isOpen: boolean) => set({ isChapterViewOpen: isOpen })
}));
