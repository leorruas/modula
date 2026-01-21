import { Project, Chart } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { useEffect, useState, useMemo } from 'react';
import { chartService } from '@/services/chartService';
import { projectService } from '@/services/projectService';
import { X, FileText, GripVertical, GripHorizontal } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChapterDashboardProps {
    project: Project;
    onClose: () => void;
    onExportChapter: (chapterIndex: number, chapterTitle: string, format: 'png' | 'pdf') => void;
}

// Sortable Chapter Component
function SortableChapter({ id, chapter, children }: { id: string | number, chapter: any, children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        border: '1px solid #eee',
        padding: 20
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Only the grip is the drag handle */}
                    <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#999' }}>
                        <GripVertical size={20} />
                    </div>
                    <h3 style={{ fontSize: 18, color: '#333', margin: 0 }}>
                        {chapter.title}
                    </h3>
                </div>
                {/* Export/Actions could go here */}
            </div>
            {children}
        </div>
    );
}

// Sortable Page Component
function SortablePage({ id, pageNum, charts, gridConfig, onClick }: { id: string | number, pageNum: number, charts: Chart[], gridConfig: any, onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: 'default',
        position: 'relative' as const
    };

    return (
        <div ref={setNodeRef} style={style} className="hover-card">
            {/* Page Thumbnail */}
            <div style={{
                aspectRatio: gridConfig.orientation === 'landscape' ? '297/210' : '210/297',
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: 4,
                marginBottom: 10,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
                {/* Drag Handle Overlay - Top Right */}
                <div
                    {...attributes}
                    {...listeners}
                    style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        zIndex: 10,
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: 4,
                        padding: 4,
                        cursor: 'grab',
                        border: '1px solid #ccc'
                    }}
                >
                    <GripHorizontal size={16} color="#666" />
                </div>

                {/* Content Click Area */}
                <div
                    onClick={onClick}
                    style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                >
                    {/* Mini rendering of charts as blocks */}
                    {charts.map(chart => (
                        <div
                            key={chart.id}
                            style={{
                                position: 'absolute',
                                left: `${(chart.module.x * (gridConfig.width / gridConfig.columns) / gridConfig.width) * 100}%`,
                                top: `${(chart.module.y * (gridConfig.height / gridConfig.rows) / gridConfig.height) * 100}%`,
                                width: `${(chart.module.w * (gridConfig.width / gridConfig.columns) / gridConfig.width) * 100}%`,
                                height: `${(chart.module.h * (gridConfig.height / gridConfig.rows) / gridConfig.height) * 100}%`,
                                background: chart.style?.colorPalette?.[0] || '#ccc',
                                opacity: 0.5,
                                border: '1px solid white'
                            }}
                        />
                    ))}

                    {charts.length === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#eee' }}>
                            <FileText size={32} />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 13, color: '#555' }}>
                Página {pageNum}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#999' }}>
                {charts.length} gráficos
            </div>
        </div>
    );
}

export function ChapterDashboard({ project, onClose, onExportChapter }: ChapterDashboardProps) {
    const { setActivePage, setIsChapterViewOpen, triggerRefresh } = useEditorStore();
    const [charts, setCharts] = useState<Chart[]>([]);
    const [loading, setLoading] = useState(true);

    // Local State for Optimistic DnD
    // chapterOrder: Array of original indices. e.g. [0, 1, 2]
    const [chapterOrder, setChapterOrder] = useState<number[]>([]);

    // pageSequence: Array of page numbers. e.g. [1, 2, 3, 4, 5]
    const [pageSequence, setPageSequence] = useState<number[]>([]);

    const [activeId, setActiveId] = useState<string | number | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        chartService.getProjectCharts(project.id).then(data => {
            setCharts(data);
            setLoading(false);
        });
    }, [project.id]);

    useEffect(() => {
        // Init Chapter Order
        if (project.chapters) {
            setChapterOrder(project.chapters.map((_, i) => i));
        } else {
            setChapterOrder([]);
        }
    }, [project.chapters]);

    useEffect(() => {
        // Init Page Sequence
        const seq = [];
        for (let i = 1; i <= (project.totalPages || 0); i++) seq.push(i);
        setPageSequence(seq);
    }, [project.totalPages]);

    const handleNavigate = (page: number) => {
        setActivePage(page);
        setIsChapterViewOpen(false); // Close dashboard
    };

    // Derived Structure for Rendering
    const structure = useMemo(() => {
        if (loading) return [];

        const rawChapters = project.chapters || [];
        // Reorder chapters based on chapterOrder
        const orderedChapters = chapterOrder.map(idx => ({ ...rawChapters[idx], originalIndex: idx }));

        // "Intro" block if needed.
        // NOTE: Intro is not sortable with chapters in this model, it stays at top.
        // It consumes pages from sequence until the first chapter starts?
        // Wait, if we change page sequence, "First Chapter Start" (pointer) needs meaning.

        // Problem: `project.chapters[i].startPage` is static until saved.
        // But if I dragged pages around, the "content" at `startPage` might be different.
        // The Visualization should assume "Content is Fluent".
        // Chapter 1 is "What's in slot [start, end]".

        // So we build blocks based on current (static) startPages, but fill them with `pageSequence` content.

        // We need to re-sort the reordered chapters by their startPage to define slots?
        // NO. The user reordered the chapters.
        // If I reorder Ch A (pg 1-5) and Ch B (pg 6-10).
        // If I swap them -> Ch B (pg 1-5?), Ch A (pg 6-10?).
        // Usually, reordering chapters SWAPS CONTENT ranges.
        // But `reorderChapters` backend keeps the content in the "slots"?
        // No, `reorderChapters` remaps page numbers.
        // My Backend Logic: "Block A (Pg 1-5) becomes Block B position".
        // So visually, I should act as if the chapter BLOCKS moved.

        // This is tricky for optimistic UI without fully simulating the backend.
        // Simplified approach: structure renders based on `chapterOrder`.
        // The PAGES inside the chapters are also just chunks of `pageSequence`.
        // Which chunk?
        // If I haven't saved yet, the `startPage` props are still old.
        // But I dragged chapters...

        // Let's assume for Chapter drag, we just reorder the visual Blocks.
        // The pages *inside* the blocks travel with the block.
        // So Block 1 (Title A, Pages 1-5) moves to Pos 2.
        // Block 2 (Title B, Pages 6-10) moves to Pos 1.

        // If I just render `orderedChapters`...
        // Ch A (start 1). Ch B (start 6).
        // Order: [Ch B, Ch A].
        // Render B: Page 6-10.
        // Render A: Page 1-5.
        // Visual: [ 6,7,8,9,10 ] then [ 1,2,3,4,5 ].
        // This is actually mostly correct for visual feedback.

        const result = [];

        // Intro (Before first chapter in ORIGINAL order? No, before everything?)
        // Usually Intro is fixed at start.
        // Let's assume Intro is NOT part of the sortable list.

        // We need "Intro" pages.
        // Using "Static" startPage of the geographically first chapter?
        // Or strictly page 1 to min(startPages)?
        // Let's use `pageSequence` to populate.

        const allChaptersSortedByStart = [...rawChapters].sort((a, b) => a.startPage - b.startPage);
        const firstStart = allChaptersSortedByStart.length > 0 ? allChaptersSortedByStart[0].startPage : (project.totalPages || 0) + 1;

        // Intro Pages
        if (firstStart > 1) {
            const introPages = pageSequence.slice(0, firstStart - 1);
            result.push({
                id: 'intro',
                title: 'Intro / Sem Capítulo',
                pages: introPages,
                isIntro: true
            });
        }

        // Sortable Chapters
        orderedChapters.forEach((chap) => {
            // Determine length of this chapter
            // We need to find this chapter in original static list to know its length/range?
            // Yes. Chap A (start 1). Next Chap (start 6). Length 5.
            // We use that "Length" to slice `pageSequence`.
            // Wait, if I reorder pages, `pageSequence` changes.
            // If I reorder chapters, `orderedChapters` changes.

            // To simplify:
            // Just find the pages that "belong" to this chapter index currently.
            // "Belong" = "Are currently in the slots assigned to this chapter".

            // Issue: If I drag Chapter A to end.
            // Does it take Pages 1-5 with it? Yes.
            // So I need to map "Original Pages" to "Current Chapter".

            // Let's rely on simple filtering for now:
            // Each "Chapter Block" in the UI will display the pages that satisfy the `blocks` logic
            // But we are in "Optimistic Limbo".

            // Actually, for Chapter reordering, it's easier to disable "Page View" in the chapter while dragging?
            // No.

            // Let's just filter `charts` based on page numbers. 
            // But page numbers change on save.

            // Maybe I shouldn't over-engineer the optimistic part for Chapters.
            // dnd-kit `arrayMove` just swaps the DOM nodes.
            // The nodes contain the content rendered *at that moment*.
            // So if I render `SortableChapter` with `pages`, and I swap `SortableChapter`s, the pages travel with it.
            // This is handled by React standard rendering of the list.

            // So what pages do I pass to `SortableChapter`?
            // I pass `chap.startPage` -> `nextChap.startPage`.
            // And I slice `pageSequence`.
            // BUT `pageSequence` is 1..N.
            // If I haven't reordered pages, `pageSequence` is 1, 2, 3...
            // Ch A (1-5). Ch B (6-10).
            // If I swap in UI.
            // List: [Ch B, Ch A].
            // Item 1 (Ch B): Renders pages 6-10.
            // Item 2 (Ch A): Renders pages 1-5.
            // Visual: 6,7,8,9,10 ... 1,2,3,4,5.
            // This looks correct as "I moved Chapter B to top".

            // Pages inside:
            // Find original startPage and endPage to slice from `pageSequence`.
            // `allChaptersSortedByStart` helps find "Next Chapter".

            const originalSortedIndex = allChaptersSortedByStart.findIndex(c => c.title === chap.title); // Unsafe if duplicate titles
            const myStart = chap.startPage;
            const nextC = allChaptersSortedByStart[originalSortedIndex + 1];
            const myEnd = nextC ? nextC.startPage - 1 : (project.totalPages || 0);

            // Get pages from sequence that "currently" occupy these slots?
            // No, get the pages that ARE these pages in the sequence?
            // If I move Page 1 to 5. `pageSequence` = 2, 3, 4, 5, 1.
            // Ch A (1-5).
            // It should show `2, 3, 4, 5, 1`.
            // So use indices `myStart-1` to `myEnd`.

            const pages = pageSequence.slice(myStart - 1, myEnd); // slice is end-exclusive? No, slice(start, end) stops before end.
            // Need (myStart-1) to (myEnd).
            // Correct: slice(myStart - 1, myEnd).

            result.push({
                id: `chapter-${chap.originalIndex}`,
                title: chap.title,
                pages: pages,
                originalIndex: chap.originalIndex,
                isIntro: false
            });
        });

        return result;

    }, [project, chapterOrder, pageSequence, loading]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        if (active.id === over.id) return;

        // Check if Chapter or Page
        const isChapter = active.id.toString().startsWith('chapter-');

        if (isChapter) {
            // Reorder Chapters
            // Extract indices
            const oldId = active.id.toString();
            const newId = over.id.toString();
            // We need to find these in the `chapterOrder` array?
            // `SortableContext` was passed `items` = IDs.
            // active.id is the ID.

            setChapterOrder((items) => {
                const oldIndex = items.findIndex(idx => `chapter-${idx}` === oldId);
                const newIndex = items.findIndex(idx => `chapter-${idx}` === newId);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Trigger Backend
                projectService.reorderChapters(project.id, newOrder).then(() => {
                    triggerRefresh();
                });

                return newOrder;
            });
        } else {
            // Reorder Page
            // active.id = pageNum (number). over.id = pageNum (number).
            const fromPage = Number(active.id);
            const toPage = Number(over.id);

            // Optimistic Update
            setPageSequence((items) => {
                const oldIndex = items.indexOf(fromPage);
                const newIndex = items.indexOf(toPage);
                return arrayMove(items, oldIndex, newIndex);
            });

            // Backend
            // Note: toPage from Drag is "The item I dropped over".
            // Backend `movePage` expects "Target Page Number".
            // If I drop 1 onto 5. It implies "Insert at 5".
            // But visually I swapped their *positions*?
            // `arrayMove` moves item from Index A to Index B.
            // The item at Index B shifts.
            // So the Target Page Number IS the index + 1.
            // Let's check `toPage`.
            // If I drop over Page 5. `toPage` = 5.
            // Index of 5 is 4.
            // `arrayMove` moves item to index 4.
            // Item becomes the 5th item.
            // So `movePage(projectId, fromPage, toPage)` should be correct IF toPage is "The value of the page I dropped ON".
            // No, `toPage` in my backend is "The new 1-based index".
            // dnd-kit `over.id` is the ID of the item I'm over.
            // NOT the index.
            // But since my IDs ARE the page numbers...
            // Wait. ID of item at pos 5 IS NOT NECESSARILY 5 if I scrambled them previously.
            // ID = Page Content ID (Original Page Number).
            // Logic mismatch. dnd-kit sorts ITEMS.
            // My Page IDs are `pageNum` from `pageSequence`?
            // Yes. `pageSequence` contains [1, 5, 2...].
            // If I drag 1. ID=1.
            // I drop over 5. ID=5.
            // I need the INDEX of 5.
            // const newIndex = items.indexOf(5).
            // destinationPage = newIndex + 1.

            // Correct Logic:
            const items = pageSequence;
            const newIndex = items.indexOf(toPage);
            const destinationPage = newIndex + 1;

            await projectService.movePage(project.id, fromPage, destinationPage);
            triggerRefresh(); // Refresh to update derived structure correctly
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{
                position: 'absolute',
                top: 60,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#f8f9fa',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '20px 40px', borderBottom: '1px solid #e0e0e0', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Estrutura do Projeto</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#666' }}>Arraste para reordenar capítulos e páginas</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#666' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>

                        {/* Intro Section - Non-sortable Wrapper but Sortable Pages */}
                        {structure.filter(s => s.isIntro).map(intro => (
                            <div key="intro" style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 10 }}>
                                    <h3 style={{ fontSize: 18, color: '#333', margin: 0 }}>{intro.title}</h3>
                                </div>
                                <SortableContext items={intro.pages} strategy={rectSortingStrategy}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                                        {intro.pages.map(pageNum => (
                                            <SortablePage
                                                key={pageNum}
                                                id={pageNum}
                                                pageNum={pageNum}
                                                charts={charts.filter(c => (c.page || 1) === pageNum)} // This matching is weak if pageNum is original? 
                                                // Actually pageSequence contains original page numbers.
                                                // If I move 1 to 5. sequence[4] = 1.
                                                // Renders Page 1.
                                                // charts.filter(c => page === 1).
                                                // This is correct because the chart still thinks it's on page 1 until refreshed.
                                                gridConfig={project.gridConfig}
                                                onClick={() => handleNavigate(pageNum)} // This navigates to "Page 1". But effectively index 5.
                                            // handleNavigate sets activePage.
                                            // activePage is usually index? 
                                            // `Canvas` renders `activePage`.
                                            // If I navigate to 1, and 1 is at pos 5.
                                            // Does Canvas display page 1?
                                            // Canvas usually displays "Page at index activePage".
                                            // Or "Page with number activePage"?
                                            // Canvas: `const activeChart = charts.filter(c => c.page === activePage)`?
                                            // If so, it displays content of 1.
                                            // So `handleNavigate` should pass the PAGE NUMBER (ID), not index.
                                            // So this is correct.
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </div>
                        ))}

                        <SortableContext
                            items={structure.filter(s => !s.isIntro).map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {structure.filter(s => !s.isIntro).map((section) => (
                                <SortableChapter key={section.id} id={section.id} chapter={section}>
                                    <SortableContext items={section.pages} strategy={rectSortingStrategy}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                                            {section.pages.map(pageNum => (
                                                <SortablePage
                                                    key={pageNum}
                                                    id={pageNum}
                                                    pageNum={pageNum}
                                                    charts={charts.filter(c => (c.page || 1) === pageNum)}
                                                    gridConfig={project.gridConfig}
                                                    onClick={() => handleNavigate(pageNum)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </SortableChapter>
                            ))}
                        </SortableContext>
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div style={{ padding: 10, background: 'white', border: '1px solid #ccc', borderRadius: 4, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                            Moving...
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
