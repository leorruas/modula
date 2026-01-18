import { Project, Chart } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { useEffect, useState } from 'react';
import { chartService } from '@/services/chartService';
import { X, FileText } from 'lucide-react';

interface ChapterDashboardProps {
    project: Project;
    onClose: () => void;
    onExportChapter: (chapterIndex: number, chapterTitle: string, format: 'png' | 'pdf') => void;
}

export function ChapterDashboard({ project, onClose, onExportChapter }: ChapterDashboardProps) {
    const { setActivePage, setIsChapterViewOpen } = useEditorStore();
    const [charts, setCharts] = useState<Chart[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportMenuOpen, setExportMenuOpen] = useState<number | null>(null);

    useEffect(() => {
        chartService.getProjectCharts(project.id).then(data => {
            setCharts(data);
            setLoading(false);
        });
    }, [project.id]);

    const handleNavigate = (page: number) => {
        setActivePage(page);
        setIsChapterViewOpen(false); // Close dashboard
    };

    // Group pages by Chapter
    const chapters = project.chapters || [];
    const totalPages = project.totalPages || 1;

    // Create a map of structure: [ { title: 'Chapter 1', pages: [1, 2, 3] }, ... ]
    // If no chapters, everything is "General" (but user asked for Chapter focus)
    // Logic: A chapter starts at `startPage`. It goes until the next chapter starts.
    // If pages exist before first chapter, they are "Front Matter" or "Uncategorized".

    const structure: { title: string; pages: number[]; originalIndex: number }[] = [];

    // Sort chapters by startPage
    const sortedChapters = [...chapters].sort((a, b) => a.startPage - b.startPage);

    // Handle pages before first chapter
    if (sortedChapters.length > 0 && sortedChapters[0].startPage > 1) {
        const pagesBefore = [];
        for (let i = 1; i < sortedChapters[0].startPage; i++) pagesBefore.push(i);
        structure.push({ title: 'Intro / Sem Capítulo', pages: pagesBefore, originalIndex: -1 });
    } else if (sortedChapters.length === 0) {
        // No chapters defined
        const allPages = [];
        for (let i = 1; i <= totalPages; i++) allPages.push(i);
        structure.push({ title: 'Projeto Completo', pages: allPages, originalIndex: -1 });
    }

    // Handle chapters
    sortedChapters.forEach((chapter, index) => {
        const start = chapter.startPage;
        const nextChapter = sortedChapters[index + 1];
        const end = nextChapter ? nextChapter.startPage - 1 : totalPages;

        const pages = [];
        for (let i = start; i <= end; i++) {
            // Safety check: ensure we don't exceed totalPages (though logic should hold)
            if (i <= totalPages) pages.push(i);
        }

        structure.push({ title: chapter.title, pages, originalIndex: index });
    });

    return (
        <div style={{
            position: 'absolute',
            top: 60, // Header height
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
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>Visão geral de capítulos e páginas</p>
                </div>
                <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#666' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }} onClick={() => setExportMenuOpen(null)}>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {structure.map((section, idx) => (
                        <div key={idx}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 10 }}>
                                <h3 style={{ fontSize: 18, color: '#333', margin: 0 }}>
                                    {section.title}
                                </h3>

                                {section.originalIndex >= 0 && (
                                    <div style={{ position: 'relative', display: 'none' }}>
                                        {/* EXPORT OPTIONS DISABLED */}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                                {section.pages.map(pageNum => {
                                    // Find charts for this page
                                    const pageCharts = charts.filter(c => (c.page || 1) === pageNum);

                                    return (
                                        <div
                                            key={pageNum}
                                            onClick={() => handleNavigate(pageNum)}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s'
                                            }}
                                            className="hover-card"
                                        >
                                            {/* Page Thumbnail */}
                                            <div style={{
                                                aspectRatio: project.gridConfig.orientation === 'landscape' ? '297/210' : '210/297',
                                                background: 'white',
                                                border: '1px solid #ddd',
                                                borderRadius: 4,
                                                marginBottom: 10,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                            }}>
                                                {/* Mini rendering of charts as blocks */}
                                                {pageCharts.map(chart => (
                                                    <div
                                                        key={chart.id}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${(chart.module.x * (project.gridConfig.width / project.gridConfig.columns) / project.gridConfig.width) * 100}%`,
                                                            top: `${(chart.module.y * (project.gridConfig.height / project.gridConfig.rows) / project.gridConfig.height) * 100}%`,
                                                            width: `${(chart.module.w * (project.gridConfig.width / project.gridConfig.columns) / project.gridConfig.width) * 100}%`,
                                                            height: `${(chart.module.h * (project.gridConfig.height / project.gridConfig.rows) / project.gridConfig.height) * 100}%`,
                                                            background: chart.style?.colorPalette?.[0] || '#ccc',
                                                            opacity: 0.5,
                                                            border: '1px solid white'
                                                        }}
                                                    />
                                                ))}

                                                {pageCharts.length === 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#eee' }}>
                                                        <FileText size={32} />
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ textAlign: 'center', fontWeight: 500, fontSize: 13, color: '#555' }}>
                                                Página {pageNum}
                                            </div>
                                            <div style={{ textAlign: 'center', fontSize: 11, color: '#999' }}>
                                                {pageCharts.length} gráficos
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
