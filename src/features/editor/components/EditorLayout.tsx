import { ReactNode, useState } from 'react';
import { Project } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { ChartSidebar } from './ChartSidebar';
import { GridConfigModal } from './GridConfigModal';
import { EditorSearch } from './EditorSearch';

interface EditorLayoutProps {
    project: Project;
    children: ReactNode;
}

// ... existing code

import { ChapterDashboard } from './ChapterDashboard';
import { LayoutGrid } from 'lucide-react';

// ...

export function EditorLayout({ project, children }: EditorLayoutProps) {
    const { editorMode, setEditorMode, isChapterViewOpen, setIsChapterViewOpen } = useEditorStore();
    const router = useRouter();
    const [isGridModalOpen, setIsGridModalOpen] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <header style={{
                height: 60,
                borderBottom: '1px solid #e5e5e5',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#000' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <span style={{ fontWeight: 600, color: '#000' }}>{project.name}</span>
                    <div style={{ height: 20, width: 1, background: '#e5e5e5', margin: '0 10px' }} />
                    <EditorSearch project={project} />
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Chapter View Toggle */}
                    <button
                        onClick={() => setIsChapterViewOpen(!isChapterViewOpen)}
                        title="Estrutura / Capítulos"
                        style={{
                            padding: 8,
                            borderRadius: 6,
                            border: `1px solid ${isChapterViewOpen ? '#000' : '#e5e5e5'}`,
                            background: isChapterViewOpen ? '#000' : 'white',
                            color: isChapterViewOpen ? 'white' : '#000',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <LayoutGrid size={16} />
                    </button>

                    <button
                        onClick={() => setIsGridModalOpen(true)}
                        title="Configurar Grid"
                        style={{
                            padding: 8,
                            borderRadius: 6,
                            border: '1px solid #e5e5e5',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Settings size={16} />
                    </button>

                    <div style={{ background: '#f0f0f0', padding: 4, borderRadius: 6, display: 'flex', gap: 4 }}>
                        <button
                            onClick={() => setEditorMode('rehearsal')}
                            style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: 'none',
                                background: editorMode === 'rehearsal' ? 'white' : 'transparent',
                                boxShadow: editorMode === 'rehearsal' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                fontSize: 12,
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Rehearsal
                        </button>
                        <button
                            onClick={() => setEditorMode('publication')}
                            style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: 'none',
                                background: editorMode === 'publication' ? 'black' : 'transparent',
                                color: editorMode === 'publication' ? 'white' : 'inherit',
                                boxShadow: editorMode === 'publication' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                fontSize: 12,
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Publication
                        </button>
                    </div>

                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('trigger-pdf-export'))}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #e5e5e5',
                            background: 'white',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        Exportar PDF
                    </button>

                    <div style={{ height: 20, width: 1, background: '#e5e5e5' }} />
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {project.gridConfig.pageFormat} - {project.gridConfig.orientation === 'portrait' ? 'Retrato' : 'Paisagem'}
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f5f5f5' }}>
                {children}

                {/* Dashboard Overlay */}
                {isChapterViewOpen && (
                    <ChapterDashboard project={project} onClose={() => setIsChapterViewOpen(false)} />
                )}

                <ChartSidebar projectId={project.id} />
            </main>

            <GridConfigModal
                isOpen={isGridModalOpen}
                onClose={() => setIsGridModalOpen(false)}
                project={project}
                onUpdate={() => router.refresh()}
            />
        </div>
    );
}
