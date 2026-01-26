'use client';

import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
    const [marginTop, setMarginTop] = useState(project.gridConfig.marginTop ?? project.gridConfig.margin);
    const [marginBottom, setMarginBottom] = useState(project.gridConfig.marginBottom ?? project.gridConfig.margin);
    const [marginLeft, setMarginLeft] = useState(project.gridConfig.marginLeft ?? project.gridConfig.margin);
    const [marginRight, setMarginRight] = useState(project.gridConfig.marginRight ?? project.gridConfig.margin);
    const [gutter, setGutter] = useState(project.gridConfig.gutter);

    // New fields
    const [gridMode, setGridMode] = useState<'flexible' | 'fixed'>(project.gridConfig.mode || 'flexible');
    const [fixedWidth, setFixedWidth] = useState(project.gridConfig.fixedModuleWidth || 40);
    const [fixedHeight, setFixedHeight] = useState(project.gridConfig.fixedModuleHeight || 40);
    const [baseFontSize, setBaseFontSize] = useState(project.gridConfig.baseFontSize || 11);
    const [baseFontUnit, setBaseFontUnit] = useState<'pt' | 'px' | 'mm'>(project.gridConfig.baseFontUnit || 'pt');

    const [useChapters, setUseChapters] = useState(project.useChapters || false);
    // Page Configuration State
    const [pageFormat, setPageFormat] = useState(project.gridConfig.pageFormat || 'A4');
    const [orientation, setOrientation] = useState(project.gridConfig.orientation || 'portrait');
    const [pageWidth, setPageWidth] = useState(project.gridConfig.width);
    const [pageHeight, setPageHeight] = useState(project.gridConfig.height);
    const [dimensionUnit, setDimensionUnit] = useState<'mm' | 'cm' | 'in' | 'px'>(project.gridConfig.unit || 'mm');

    const convertFromMm = (val: number, unit: string) => {
        if (unit === 'cm') return Number((val / 10).toFixed(2));
        if (unit === 'in') return Number((val / 25.4).toFixed(2));
        if (unit === 'px') return Number((val * 3.7795).toFixed(0)); // Round pixels
        return Number(val.toFixed(2));
    };

    const convertToMm = (val: number, unit: string) => {
        if (unit === 'cm') return val * 10;
        if (unit === 'in') return val * 25.4;
        if (unit === 'px') return val / 3.7795;
        return val;
    };

    // Auto-update dimensions when format/orientation changes
    useEffect(() => {
        if (pageFormat === 'Custom') return;

        let w = 210, h = 297; // Default A4 in MM
        if (pageFormat === 'A3') { w = 297; h = 420; }
        else if (pageFormat === 'A5') { w = 148; h = 210; }

        if (orientation === 'landscape') {
            const temp = w; w = h; h = temp;
        }

        // Convert strict MM dimensions to current unit
        setPageWidth(convertFromMm(w, dimensionUnit));
        setPageHeight(convertFromMm(h, dimensionUnit));
    }, [pageFormat, orientation, dimensionUnit]);

    const [isLoading, setIsLoading] = useState(false);

    // Calculate preview for fixed mode
    const getFixedModePreview = () => {
        if (gridMode !== 'fixed') return null;
        // Convert everything to MM for calculation logic compatibility
        const wMm = convertToMm(pageWidth, dimensionUnit);
        const hMm = convertToMm(pageHeight, dimensionUnit);
        const mlMm = convertToMm(marginLeft, dimensionUnit);
        const mrMm = convertToMm(marginRight, dimensionUnit);
        const mtMm = convertToMm(marginTop, dimensionUnit);
        const mbMm = convertToMm(marginBottom, dimensionUnit);
        const gMm = convertToMm(gutter, dimensionUnit);
        const fwMm = convertToMm(fixedWidth, dimensionUnit);
        const fhMm = convertToMm(fixedHeight, dimensionUnit);

        const availW = wMm - (mlMm + mrMm);
        const availH = hMm - (mtMm + mbMm);
        const cols = Math.max(1, Math.floor((availW + gMm) / (fwMm + gMm)));
        const rows = Math.max(1, Math.floor((availH + gMm) / (fhMm + gMm)));
        return { cols, rows };
    };

    // Reset state when project changes or modal opens
    useEffect(() => {
        if (isOpen) {
            const u = project.gridConfig.unit || 'mm';
            setDimensionUnit(u);

            setColumns(project.gridConfig.columns);
            setRows(project.gridConfig.rows);

            // Convert stored MM values to Project Unit
            setMarginTop(convertFromMm(project.gridConfig.marginTop ?? project.gridConfig.margin, u));
            setMarginBottom(convertFromMm(project.gridConfig.marginBottom ?? project.gridConfig.margin, u));
            setMarginLeft(convertFromMm(project.gridConfig.marginLeft ?? project.gridConfig.margin, u));
            setMarginRight(convertFromMm(project.gridConfig.marginRight ?? project.gridConfig.margin, u));
            setGutter(convertFromMm(project.gridConfig.gutter, u));

            setGridMode(project.gridConfig.mode || 'flexible');
            setFixedWidth(convertFromMm(project.gridConfig.fixedModuleWidth || 40, u));
            setFixedHeight(convertFromMm(project.gridConfig.fixedModuleHeight || 40, u));

            // Page Dim
            setPageWidth(convertFromMm(project.gridConfig.width, u));
            setPageHeight(convertFromMm(project.gridConfig.height, u));

            setBaseFontSize(project.gridConfig.baseFontSize || 11);
            setBaseFontUnit(project.gridConfig.baseFontUnit || 'pt');
            setUseChapters(project.useChapters || false);
        }
    }, [isOpen, project]);

    const handleUnitChange = (newUnit: 'mm' | 'cm' | 'in' | 'px') => {
        // Convert all currently edited values to new unit
        // We convert to MM then to New Unit to avoid compounding errors
        const toNew = (val: number) => convertFromMm(convertToMm(val, dimensionUnit), newUnit);

        setMarginTop(prev => toNew(prev));
        setMarginBottom(prev => toNew(prev));
        setMarginLeft(prev => toNew(prev));
        setMarginRight(prev => toNew(prev));
        setGutter(prev => toNew(prev));
        setFixedWidth(prev => toNew(prev));
        setFixedHeight(prev => toNew(prev));
        setPageWidth(prev => toNew(prev));
        setPageHeight(prev => toNew(prev));

        setDimensionUnit(newUnit);
    };

    const preview = getFixedModePreview();
    const showWarning = preview && (preview.cols < 4 || preview.rows < 4 || preview.cols > 20 || preview.rows > 20);

    if (!isOpen) return null;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Convert everything back to MM for storage
            const wMm = convertToMm(pageWidth, dimensionUnit);
            const hMm = convertToMm(pageHeight, dimensionUnit);
            const mlMm = convertToMm(marginLeft, dimensionUnit);
            const mrMm = convertToMm(marginRight, dimensionUnit);
            const mtMm = convertToMm(marginTop, dimensionUnit);
            const mbMm = convertToMm(marginBottom, dimensionUnit);
            const gMm = convertToMm(gutter, dimensionUnit);
            const fwMm = convertToMm(fixedWidth, dimensionUnit);
            const fhMm = convertToMm(fixedHeight, dimensionUnit);

            // Logic to calc cols/rows if fixed
            let finalColumns = columns;
            let finalRows = rows;

            if (gridMode === 'fixed') {
                const availW = wMm - (mlMm + mrMm);
                const availH = hMm - (mtMm + mbMm);

                finalColumns = Math.max(1, Math.floor((availW + gMm) / (fwMm + gMm)));
                finalRows = Math.max(1, Math.floor((availH + gMm) / (fhMm + gMm)));
            }

            const newGridConfig: GridConfig = {
                ...project.gridConfig,
                columns: finalColumns,
                rows: finalRows,
                margin: mtMm, // Deprecated fallback
                marginTop: mtMm,
                marginBottom: mbMm,
                marginLeft: mlMm,
                marginRight: mrMm,
                gutter: gMm,
                mode: gridMode,
                pageFormat,
                orientation,
                width: wMm,
                height: hMm,
                baseFontSize,
                baseFontUnit,
                unit: dimensionUnit, // Save preference
                ...(gridMode === 'fixed' && fwMm && fhMm ? {
                    fixedModuleWidth: fwMm,
                    fixedModuleHeight: fhMm
                } : {})
            };

            if (gridMode === 'flexible') {
                delete (newGridConfig as any).fixedModuleWidth;
                delete (newGridConfig as any).fixedModuleHeight;
            }

            await projectService.updateProject(project.id, {
                gridConfig: newGridConfig,
                useChapters
            });

            toast.success("Configuração atualizada!");
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar grid");
        } finally {
            setIsLoading(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .grid-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; color: #111; background: #fff; }
                .grid-input:focus { border-color: #111; outline: none; box-shadow: 0 0 0 2px rgba(0,0,0,0.05); }
                .grid-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #333; }
                .grid-section-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; color: #111; }
            `}</style>
            <div style={{
                background: 'white', padding: '40px', borderRadius: 16, width: 900, maxWidth: '95vw', maxHeight: '90vh',
                overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <h2 style={{ fontSize: 28, marginBottom: 30, fontFamily: 'Georgia, serif', fontWeight: 'bold', color: '#000', textAlign: 'center' }}>Configurações do Projeto</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30, marginBottom: 40 }}>
                        {/* Column 1: Page & Margins */}
                        <div>
                            <h3 className="grid-section-title">Formato da Página</h3>

                            {/* UNIT SELECTOR */}
                            <div style={{ marginBottom: 20, padding: 10, background: '#f5f5f5', borderRadius: 6 }}>
                                <label className="grid-label" style={{ marginBottom: 8 }}>Unidade Preferida</label>
                                <div style={{ display: 'flex', gap: 15 }}>
                                    {(['mm', 'cm', 'in', 'px'] as const).map(u => (
                                        <label key={u} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#333' }}>
                                            <input
                                                type="radio"
                                                name="dimensionUnit"
                                                value={u}
                                                checked={dimensionUnit === u}
                                                onChange={() => handleUnitChange(u)}
                                            />
                                            {u.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                                <div>
                                    <label className="grid-label">Formato</label>
                                    <select className="grid-input" value={pageFormat} onChange={e => setPageFormat(e.target.value as any)}>
                                        <option value="A4">A4</option>
                                        <option value="A3">A3</option>
                                        <option value="A5">A5</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="grid-label">Orientação</label>
                                    <select className="grid-input" value={orientation} onChange={e => setOrientation(e.target.value as any)}>
                                        <option value="portrait">Retrato</option>
                                        <option value="landscape">Paisagem</option>
                                    </select>
                                </div>
                            </div>

                            {pageFormat === 'Custom' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                                    <div>
                                        <label className="grid-label">Largura ({dimensionUnit})</label>
                                        <input type="number" step="0.1" className="grid-input" value={pageWidth} onChange={e => setPageWidth(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="grid-label">Altura ({dimensionUnit})</label>
                                        <input type="number" step="0.1" className="grid-input" value={pageHeight} onChange={e => setPageHeight(Number(e.target.value))} />
                                    </div>
                                </div>
                            )}

                            <div style={{ padding: 15, background: '#f9f9f9', borderRadius: 8, fontSize: 13, color: '#666' }}>
                                <strong>Dimensões Atuais:</strong><br />
                                {pageWidth}{dimensionUnit} x {pageHeight}{dimensionUnit}
                            </div>
                        </div>

                        {/* Column 2: Grid Structure */}
                        <div>
                            <h3 className="grid-section-title">Estrutura do Grid</h3>
                            <div style={{ marginBottom: 20 }}>
                                <label className="grid-label">Número de Colunas</label>
                                <input type="number" className="grid-input" value={columns} onChange={e => setColumns(Number(e.target.value))} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label className="grid-label">Número de Linhas</label>
                                <input type="number" className="grid-input" value={rows} onChange={e => setRows(Number(e.target.value))} />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label className="grid-label">Gutter ({dimensionUnit})</label>
                                <input type="number" step="0.1" className="grid-input" value={gutter} onChange={e => setGutter(Number(e.target.value))} />
                            </div>

                            <h3 className="grid-section-title" style={{ marginTop: 30 }}>Subdivisões</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                                <input id="useChapters" type="checkbox" checked={useChapters} onChange={e => setUseChapters(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                                <label htmlFor="useChapters" style={{ fontSize: 14, color: '#222', cursor: 'pointer', fontWeight: 500 }}>Ativar Estrutura de Capítulos</label>
                            </div>
                        </div>

                        {/* Column 3: Dimensions & Font */}
                        <div>
                            <h3 className="grid-section-title">Dimensionamento</h3>
                            <div style={{ marginBottom: 20 }}>
                                <label className="grid-label">Modo de Distribuição</label>
                                <select className="grid-input" value={gridMode} onChange={e => setGridMode(e.target.value as 'flexible' | 'fixed')}>
                                    <option value="flexible">Flexível (Preenche a página)</option>
                                    <option value="fixed">Fixo (Define tamanho do módulo)</option>
                                </select>
                            </div>

                            {gridMode === 'fixed' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                                    <div>
                                        <label className="grid-label">Largura ({dimensionUnit})</label>
                                        <input type="number" step="0.1" className="grid-input" value={fixedWidth} onChange={e => setFixedWidth(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="grid-label">Altura ({dimensionUnit})</label>
                                        <input type="number" step="0.1" className="grid-input" value={fixedHeight} onChange={e => setFixedHeight(Number(e.target.value))} />
                                    </div>
                                </div>
                            )}

                            <h3 className="grid-section-title" style={{ marginTop: 30 }}>Tipografia Mestra</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div>
                                    <label className="grid-label">Tam. Fonte</label>
                                    <input type="number" className="grid-input" value={baseFontSize} onChange={e => setBaseFontSize(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="grid-label">Unidade</label>
                                    <select className="grid-input" value={baseFontUnit} onChange={e => setBaseFontUnit(e.target.value as any)}>
                                        <option value="pt">Pontos (pt)</option>
                                        <option value="px">Pixels (px)</option>
                                        <option value="mm">Milímetros (mm)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 15, borderTop: '1px solid #f0f0f0', paddingTop: 25 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                cursor: 'pointer',
                                color: '#444',
                                fontWeight: 600,
                                fontSize: 14,
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f9f9f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                padding: '12px 30px',
                                background: '#000',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 14,
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'transform 0.1s, background 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#222'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#000'}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
