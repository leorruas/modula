'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { projectService } from '@/services/projectService';
import { toast } from 'sonner';
import { GridConfig } from '@/types';
import { useRouter } from 'next/navigation';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const PRESETS = {
    'A4': { width: 210, height: 297 },
    'A3': { width: 297, height: 420 },
    'A5': { width: 148, height: 210 },
};

export function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
    const { user } = useUserStore();
    const router = useRouter();
    const [columns, setColumns] = useState(4);
    const [rows, setRows] = useState(4);
    const [marginTop, setMarginTop] = useState(20);
    const [marginBottom, setMarginBottom] = useState(20);
    const [marginLeft, setMarginLeft] = useState(20);
    const [marginRight, setMarginRight] = useState(20);
    const [gutter, setGutter] = useState(5);
    const [name, setName] = useState('');
    const [format, setFormat] = useState<'A4' | 'A3' | 'A5' | 'Custom'>('A4');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    // Custom Dimensions State
    const [customWidth, setCustomWidth] = useState(210);
    const [customHeight, setCustomHeight] = useState(297);
    // Grid Mode
    const [gridMode, setGridMode] = useState<'flexible' | 'fixed'>('flexible');
    const [fixedWidth, setFixedWidth] = useState(40);
    const [fixedHeight, setFixedHeight] = useState(40);
    const [unit, setUnit] = useState<'mm' | 'cm' | 'px'>('mm');
    const [baseFontSize, setBaseFontSize] = useState(11);
    const [baseFontUnit, setBaseFontUnit] = useState<'pt' | 'px' | 'mm'>('pt');

    const [isLoading, setIsLoading] = useState(false);

    const unitFactors = {
        mm: 1,
        cm: 10,
        px: 25.4 / 96
    };

    const toMM = (val: number, u: 'mm' | 'cm' | 'px') => val * unitFactors[u];
    const fromMM = (val: number, u: 'mm' | 'cm' | 'px') => val / unitFactors[u];

    const handleUnitChange = (newUnit: 'mm' | 'cm' | 'px') => {
        const factor = unitFactors[unit] / unitFactors[newUnit];

        setCustomWidth(prev => Number((prev * factor).toFixed(2)));
        setCustomHeight(prev => Number((prev * factor).toFixed(2)));
        setMarginTop(prev => Number((prev * factor).toFixed(2)));
        setMarginBottom(prev => Number((prev * factor).toFixed(2)));
        setMarginLeft(prev => Number((prev * factor).toFixed(2)));
        setMarginRight(prev => Number((prev * factor).toFixed(2)));
        setGutter(prev => Number((prev * factor).toFixed(2)));
        setFixedWidth(prev => Number((prev * factor).toFixed(2)));
        setFixedHeight(prev => Number((prev * factor).toFixed(2)));

        setUnit(newUnit);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        try {
            let width = customWidth; // Default to custom input
            let height = customHeight;

            // If preset, lock dimensions to preset (ignoring custom input/unit)
            if (format !== 'Custom') {
                const preset = PRESETS[format];
                if (orientation === 'portrait') {
                    width = preset.width;
                    height = preset.height;
                } else {
                    width = preset.height;
                    height = preset.width;
                }
            } else {
                // If custom, convert to MM based on unit
                width = toMM(customWidth, unit);
                height = toMM(customHeight, unit);
            }

            // If Fixed Mode, calculate approx columns/rows for backend standard
            let finalColumns = columns;
            let finalRows = rows;

            if (gridMode === 'fixed') {
                // Calculate how many fit
                const availW = width - (toMM(marginLeft, unit) + toMM(marginRight, unit));
                const availH = height - (toMM(marginTop, unit) + toMM(marginBottom, unit));
                // Equation: n * w + (n-1) * g <= avail
                // n(w+g) - g <= avail
                // n(w+g) <= avail + g
                // n <= (avail + g) / (w + g)
                finalColumns = Math.floor((availW + gutter) / (fixedWidth + gutter));
                finalRows = Math.floor((availH + gutter) / (fixedHeight + gutter));

                // Avoid zero
                finalColumns = Math.max(1, finalColumns);
                finalRows = Math.max(1, finalRows);
            }

            const gridConfig: GridConfig = {
                pageFormat: format as any,
                orientation,
                width: Math.round(width * 100) / 100,
                height: Math.round(height * 100) / 100,
                columns: finalColumns,
                rows: finalRows,
                margin: toMM(marginTop, unit), // Legacy fallback
                marginTop: toMM(marginTop, unit),
                marginBottom: toMM(marginBottom, unit),
                marginLeft: toMM(marginLeft, unit),
                marginRight: toMM(marginRight, unit),
                gutter: toMM(gutter, unit),
                mode: gridMode,
                fixedModuleWidth: gridMode === 'fixed' ? toMM(fixedWidth, unit) : undefined,
                fixedModuleHeight: gridMode === 'fixed' ? toMM(fixedHeight, unit) : undefined,
                baseFontSize,
                baseFontUnit
            };

            const newProject = await projectService.createProject(user.uid, {
                name,
                gridConfig,
                totalPages: 1
            });

            toast.success("Projeto criado com sucesso");
            onCreated();
            onClose();
            router.push(`/editor?id=${newProject.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar projeto");
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
                background: 'white', padding: 30, borderRadius: 8, width: 500, maxWidth: '90vw',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ fontFamily: 'Georgia, serif', marginBottom: 20, color: '#111' }}>Novo Projeto</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#333' }}>Nome do Projeto</label>
                        <input
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, color: '#333' }}
                            placeholder="Meu Projeto Editorial"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#333' }}>Formato</label>
                            <select
                                value={format}
                                onChange={e => setFormat(e.target.value as any)}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, color: '#333' }}
                            >
                                <option value="A4">A4</option>
                                <option value="A3">A3</option>
                                <option value="A5">A5</option>
                                <option value="Custom">Personalizado</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#333' }}>Orientação</label>
                            <select
                                value={orientation}
                                onChange={e => setOrientation(e.target.value as any)}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, color: '#333' }}
                            >
                                <option value="portrait">Retrato</option>
                                <option value="landscape">Paisagem</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 15, padding: 15, background: '#f5f5f5', borderRadius: 6, border: '1px solid #e0e0e0' }}>
                        <div style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600, color: '#444' }}>Unidade de Medida</label>
                            <div style={{ display: 'flex', gap: 15 }}>
                                {(['mm', 'cm', 'px'] as const).map(u => (
                                    <label key={u} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
                                        <input
                                            type="radio"
                                            name="unit"
                                            value={u}
                                            checked={unit === u}
                                            onChange={() => handleUnitChange(u)}
                                        />
                                        {u.toUpperCase()}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {format === 'Custom' && (
                        <div style={{ marginBottom: 15, padding: 15, background: '#f5f5f5', borderRadius: 6, border: '1px solid #e0e0e0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#333' }}>Largura ({unit})</label>
                                    <input type="number" step="0.1" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 500, color: '#333' }}>Altura ({unit})</label>
                                    <input type="number" step="0.1" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: 6, marginBottom: 15, border: '1px solid #e0e0e0' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 'bold', color: '#333' }}>Tipografia do Documento</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Tamanho Fonte Base</label>
                                <input
                                    type="number"
                                    value={baseFontSize}
                                    onChange={e => setBaseFontSize(Number(e.target.value))}
                                    style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, color: '#555' }}>Unidade</label>
                                <select
                                    value={baseFontUnit}
                                    onChange={e => setBaseFontUnit(e.target.value as any)}
                                    style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#333' }}
                                >
                                    <option value="pt">Pontos (pt)</option>
                                    <option value="px">Pixels (px)</option>
                                    <option value="mm">Milímetros (mm)</option>
                                </select>
                            </div>
                        </div>
                        <p style={{ fontSize: 10, color: '#666', marginTop: 8, fontStyle: 'italic' }}>
                            O tamanho que você usa no seu texto corrido do relatório. Os gráficos usarão isso como referência.
                        </p>
                    </div>

                    <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: 6, marginBottom: 20, border: '1px solid #e0e0e0' }}>
                        <h4 style={{ marginBottom: 10, fontSize: 14, color: '#333', fontWeight: 'bold' }}>Sistema de Grid</h4>

                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', gap: 15 }}>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
                                    <input
                                        type="radio"
                                        checked={!gridMode || gridMode === 'flexible'}
                                        onChange={() => setGridMode('flexible')}
                                    />
                                    Flexível (Colunas/Linhas)
                                </label>
                                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
                                    <input
                                        type="radio"
                                        checked={gridMode === 'fixed'}
                                        onChange={() => setGridMode('fixed')}
                                    />
                                    Fixo (Tamanho do Módulo)
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {(!gridMode || gridMode === 'flexible') ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Colunas</label>
                                        <input type="number" value={columns} onChange={e => setColumns(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Linhas</label>
                                        <input type="number" value={rows} onChange={e => setRows(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Largura Módulo ({unit})</label>
                                        <input type="number" step="0.1" value={fixedWidth} onChange={e => setFixedWidth(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Altura Módulo ({unit})</label>
                                        <input type="number" step="0.1" value={fixedHeight} onChange={e => setFixedHeight(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                </>
                            )}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 11, color: '#555', fontWeight: 'bold' }}>Margens ({unit})</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 2, fontSize: 10, color: '#777' }}>Topo</label>
                                        <input type="number" step="0.1" value={marginTop} onChange={e => setMarginTop(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 2, fontSize: 10, color: '#777' }}>Fundo</label>
                                        <input type="number" step="0.1" value={marginBottom} onChange={e => setMarginBottom(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 2, fontSize: 10, color: '#777' }}>Esquerda</label>
                                        <input type="number" step="0.1" value={marginLeft} onChange={e => setMarginLeft(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 2, fontSize: 10, color: '#777' }}>Direita</label>
                                        <input type="number" step="0.1" value={marginRight} onChange={e => setMarginRight(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 3, fontSize: 11, color: '#555' }}>Gutter ({unit})</label>
                                <input type="number" step="0.1" value={gutter} onChange={e => setGutter(Number(e.target.value))} style={{ width: '100%', padding: 6, border: '1px solid #ccc', borderRadius: 4, color: '#333' }} />
                            </div>
                        </div>
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
                            {isLoading ? 'Criando...' : 'Criar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
