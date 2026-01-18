'use client';

import { useState, useEffect } from 'react';
import { Project, GridConfig, Chart } from '@/types';
import { projectService } from '@/services/projectService';
import { toast } from 'sonner';

interface GridConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: () => void;
}

export function GridConfigModal({ isOpen, onClose, project, onUpdate }: GridConfigModalProps) {
    const [columns, setColumns] = useState(project.gridConfig.columns);
    const [rows, setRows] = useState(project.gridConfig.rows);
    const [margin, setMargin] = useState(project.gridConfig.margin);
    const [gutter, setGutter] = useState(project.gridConfig.gutter);

    // New fields
    const [gridMode, setGridMode] = useState<'flexible' | 'fixed'>(project.gridConfig.mode || 'flexible');
    const [fixedWidth, setFixedWidth] = useState(project.gridConfig.fixedModuleWidth || 40);
    const [fixedHeight, setFixedHeight] = useState(project.gridConfig.fixedModuleHeight || 40);

    const [useChapters, setUseChapters] = useState(project.useChapters || false);
    const [isLoading, setIsLoading] = useState(false);

    // Reset state when project changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setColumns(project.gridConfig.columns);
            setRows(project.gridConfig.rows);
            setMargin(project.gridConfig.margin);
            setGutter(project.gridConfig.gutter);
            setGridMode(project.gridConfig.mode || 'flexible');
            setFixedWidth(project.gridConfig.fixedModuleWidth || 40);
            setFixedHeight(project.gridConfig.fixedModuleHeight || 40);
            setUseChapters(project.useChapters || false);
        }
    }, [isOpen, project]);

    if (!isOpen) return null;

    // Calculate preview for fixed mode
    const getFixedModePreview = () => {
        if (gridMode !== 'fixed') return null;
        const availW = project.gridConfig.width - (2 * margin);
        const availH = project.gridConfig.height - (2 * margin);
        const cols = Math.max(1, Math.floor((availW + gutter) / (fixedWidth + gutter)));
        const rows = Math.max(1, Math.floor((availH + gutter) / (fixedHeight + gutter)));
        return { cols, rows };
    };

    const preview = getFixedModePreview();
    const showWarning = preview && (preview.cols < 4 || preview.rows < 4 || preview.cols > 20 || preview.rows > 20);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Logic to calc cols/rows if fixed
            let finalColumns = columns;
            let finalRows = rows;

            if (gridMode === 'fixed') {
                const availW = project.gridConfig.width - (2 * margin);
                const availH = project.gridConfig.height - (2 * margin);

                // Fixed Grid Calculation:
                // Total Width = (Cols * ModW) + ((Cols - 1) * Gutter)
                // Total W = Cols*ModW + Cols*Gutter - Gutter
                // Total W + Gutter = Cols * (ModW + Gutter)
                // Cols = (Total W + Gutter) / (ModW + Gutter)
                finalColumns = Math.floor((availW + gutter) / (fixedWidth + gutter));
                finalRows = Math.floor((availH + gutter) / (fixedHeight + gutter));

                finalColumns = Math.max(1, finalColumns);
                finalRows = Math.max(1, finalRows);
            }

            const newGridConfig: GridConfig = {
                ...project.gridConfig,
                columns: finalColumns,
                rows: finalRows,
                margin,
                gutter,
                mode: gridMode,
                ...(gridMode === 'fixed' && fixedWidth && fixedHeight ? {
                    fixedModuleWidth: fixedWidth,
                    fixedModuleHeight: fixedHeight
                } : {})
            };

            // Remove undefined fields for flexible mode
            if (gridMode === 'flexible') {
                delete (newGridConfig as any).fixedModuleWidth;
                delete (newGridConfig as any).fixedModuleHeight;
            }

            // Note: Canvas will update automatically via Context/SWR, no need to manual refresh if using realtime store
            // But we have onUpdate prop
            await projectService.updateProject(project.id, {
                gridConfig: newGridConfig,
                useChapters
            });

            toast.success("Grid atualizado!");

            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar grid");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', padding: 30, borderRadius: 8, width: 400, maxWidth: '90vw',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ fontFamily: 'Georgia, serif', marginBottom: 20, color: '#111' }}>Configuração do Grid</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: 6, marginBottom: 20, border: '1px solid #e0e0e0' }}>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', gap: 15 }}>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
                                    <input
                                        type="radio"
                                        checked={!gridMode || gridMode === 'flexible'}
                                        onChange={() => setGridMode('flexible')}
                                    />
                                    Flexível
                                </label>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
                                    <input
                                        type="radio"
                                        checked={gridMode === 'fixed'}
                                        onChange={() => setGridMode('fixed')}
                                    />
                                    Fixo
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            {(!gridMode || gridMode === 'flexible') ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Colunas</label>
                                        <input type="number" value={columns} onChange={e => setColumns(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Linhas</label>
                                        <input type="number" value={rows} onChange={e => setRows(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Largura (mm)</label>
                                        <input type="number" value={fixedWidth} onChange={e => setFixedWidth(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Altura (mm)</label>
                                        <input type="number" value={fixedHeight} onChange={e => setFixedHeight(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div style={{ gridColumn: '1 / span 2', padding: 10, background: '#e0f2fe', borderRadius: 4, fontSize: 11, color: '#0369a1' }}>
                                        <strong>💡 Sugestões para preencher a largura:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                                            {(() => {
                                                const availW = project.gridConfig.width - (2 * margin);
                                                // Find divisors that give integer columns (approx)
                                                // W_avail = N * w + (N-1) * g
                                                // W_avail = N(w+g) - g
                                                // W_avail+g = N(w+g)
                                                // w = (W_avail+g)/N - g
                                                const suggestions = [];
                                                for (let n = 4; n <= 12; n++) {
                                                    const preciseW = (availW + gutter) / n - gutter;
                                                    // Round DOWN to 2 decimal places to ensure it always fits
                                                    // If we round up even slightly, we lose a column
                                                    const w = Math.floor(preciseW * 100) / 100;

                                                    if (w > 10) suggestions.push({ n, w: w });
                                                }
                                                return suggestions.map(s => (
                                                    <span
                                                        key={s.n}
                                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                        onClick={() => setFixedWidth(s.w)}
                                                    >
                                                        {s.n} col: {s.w}mm
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Margem (mm)</label>
                                <input type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Gutter (mm)</label>
                                <input type="number" value={gutter} onChange={e => setGutter(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: 6, marginBottom: 20, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333' }}>Usar Capítulos</label>
                            <p style={{ fontSize: 11, color: '#666', margin: 0 }}>Organizar páginas em grupos nomeados</p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 20 }}>
                            <input
                                type="checkbox"
                                checked={useChapters}
                                onChange={(e) => setUseChapters(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: useChapters ? '#000' : '#ccc', borderRadius: 34, transition: '.4s'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: 16, width: 16, left: 2, bottom: 2,
                                    backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                    transform: useChapters ? 'translateX(20px)' : 'translateX(0)'
                                }} />
                            </span>
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', color: '#555' }}>Cancelar</button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '8px 16px',
                                background: '#111',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
