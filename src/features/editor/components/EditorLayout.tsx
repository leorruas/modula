import { ReactNode, useState } from 'react';
import { Project } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Settings, FileText, Image as ImageIcon, Archive, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditorStore } from '@/store/editorStore';
import { ChartSidebar } from './ChartSidebar';
import { GridConfigModal } from './GridConfigModal';
import { EditorSearch } from './EditorSearch';

interface EditorLayoutProps {
    project: Project;
    children: ReactNode;
}

import { ChapterDashboard } from './ChapterDashboard';
import { LayoutGrid } from 'lucide-react';

import { exportChartToPng } from '@/utils/exportUtils';
import { useBulkExport } from '../hooks/useBulkExport';
import { BulkExportProgressModal } from './BulkExportProgressModal';

function ExportPngButton({ onClose }: { onClose: () => void }) {
    const { editingChartId } = useEditorStore();

    if (!editingChartId) return null;

    return (
        <button
            onClick={() => {
                exportChartToPng(editingChartId, { removeWhitespace: true });
                onClose();
            }}
            style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, background: 'none', borderTop: '1px solid #eee', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
            <ImageIcon size={16} /> Gráfico Selecionado (PNG)
        </button>
    );
}

export function EditorLayout({ project, children }: EditorLayoutProps) {
    const { isPreviewMode, setIsPreviewMode, isChapterViewOpen, setIsChapterViewOpen, triggerRefresh } = useEditorStore();
    const router = useRouter();
    const [isGridModalOpen, setIsGridModalOpen] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const { isExporting, progress, currentAction, startBulkExport, exportQueue, handleChartReady } = useBulkExport(project);

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
                zIndex: 600
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

                    {/* Preview Toggle */}
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        title={isPreviewMode ? "Sair do Preview" : "Visualizar Preview"}
                        style={{
                            padding: '8px 12px', // Slightly wider
                            borderRadius: 6,
                            border: `1px solid ${isPreviewMode ? '#000' : '#e5e5e5'}`,
                            background: isPreviewMode ? '#000' : 'white',
                            color: isPreviewMode ? 'white' : '#000',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 13,
                            fontWeight: 500
                        }}
                    >
                        {isPreviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span>Preview</span>
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

                    {/* Export Menu */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
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
                                gap: 6,
                                color: '#333'
                            }}
                        >
                            <span>Exportar</span>
                            {/* Chevron Down */}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>

                        {isExportMenuOpen && (
                            <>
                                <div
                                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                                    onClick={() => setIsExportMenuOpen(false)}
                                />
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    marginTop: 4,
                                    width: 220,
                                    background: 'white',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: 6,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    overflow: 'hidden',
                                    padding: '4px 0'
                                }}>
                                    {/* BULK EXPORT DISABLED
                                    <button
                                        onClick={() => {
                                            startBulkExport({ type: 'project' }, 'png');
                                            setIsExportMenuOpen(false);
                                        }}
                                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <Archive size={16} /> Exportar Projeto (ZIP/PNG)
                                    </button>

                                    <button
                                        onClick={() => {
                                            startBulkExport({ type: 'project' }, 'pdf');
                                            setIsExportMenuOpen(false);
                                        }}
                                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <Archive size={16} /> Exportar Projeto (ZIP/PDF)
                                    </button>
                                    */}

                                    <button
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('trigger-pdf-export'));
                                            setIsExportMenuOpen(false);
                                        }}
                                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, background: 'none', borderTop: '1px solid #eee', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <FileText size={16} /> Página Atual (PDF)
                                    </button>

                                    <ExportPngButton onClose={() => setIsExportMenuOpen(false)} />
                                </div>
                            </>
                        )}
                    </div>

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
                    <ChapterDashboard
                        project={project}
                        onClose={() => setIsChapterViewOpen(false)}
                        onExportChapter={(index, title, format) => startBulkExport({ type: 'chapter', chapterIndex: index, chapterTitle: title }, format)}
                    />
                )}

                <ChartSidebar projectId={project.id} />

                {/* Bulk Export Progress */}
                <BulkExportProgressModal
                    isOpen={isExporting}
                    progress={progress}
                    currentAction={currentAction}
                    exportQueue={exportQueue}
                    onChartReady={handleChartReady}
                />
            </main>

            <GridConfigModal
                isOpen={isGridModalOpen}
                onClose={() => setIsGridModalOpen(false)}
                project={project}
                onUpdate={() => {
                    triggerRefresh();
                    router.refresh();
                }}
            />
        </div>
    );
}

