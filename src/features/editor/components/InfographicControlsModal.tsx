import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChartData } from '@/types';

interface InfographicControlsModalProps {
    isOpen: boolean;
    onClose: () => void;
    chartData: ChartData;
    currentConfig?: {
        heroValueIndex?: number;
        showValueAnnotations?: boolean;
        showDeltaPercent?: boolean;
        annotationLabels?: string[];
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        showExtremes?: boolean;
        useMetadata?: boolean;
    };
    onSave: (config: {
        heroValueIndex?: number;
        showValueAnnotations?: boolean;
        showDeltaPercent?: boolean;
        annotationLabels?: string[];
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        showExtremes?: boolean;
        useMetadata?: boolean;
    }) => void;
}

export function InfographicControlsModal({
    isOpen,
    onClose,
    chartData,
    currentConfig = {},
    onSave
}: InfographicControlsModalProps) {
    const [heroValueIndex, setHeroValueIndex] = useState<number | undefined>(currentConfig.heroValueIndex);
    const [showValueAnnotations, setShowValueAnnotations] = useState(currentConfig.showValueAnnotations || false);
    const [showDeltaPercent, setShowDeltaPercent] = useState(currentConfig.showDeltaPercent || false);
    const [annotationLabels, setAnnotationLabels] = useState<string[]>(currentConfig.annotationLabels || []);
    const [legendPosition, setLegendPosition] = useState<'top' | 'bottom' | 'left' | 'right' | 'none'>(currentConfig.legendPosition || 'bottom');
    const [showExtremes, setShowExtremes] = useState(currentConfig.showExtremes || false);
    const [useMetadata, setUseMetadata] = useState(currentConfig.useMetadata || false);

    useEffect(() => {
        if (isOpen) {
            setHeroValueIndex(currentConfig.heroValueIndex);
            setShowValueAnnotations(currentConfig.showValueAnnotations || false);
            setShowDeltaPercent(currentConfig.showDeltaPercent || false);
            setAnnotationLabels(currentConfig.annotationLabels || []);
            setLegendPosition(currentConfig.legendPosition || 'bottom');
            setShowExtremes(currentConfig.showExtremes || false);
            setUseMetadata(currentConfig.useMetadata || false);
        }
    }, [isOpen, currentConfig]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            heroValueIndex,
            showValueAnnotations,
            showDeltaPercent,
            annotationLabels: annotationLabels.length > 0 ? annotationLabels : undefined,
            legendPosition,
            showExtremes,
            useMetadata
        });
        onClose();
    };

    const updateAnnotationLabel = (index: number, value: string) => {
        const newLabels = [...annotationLabels];
        newLabels[index] = value;
        setAnnotationLabels(newLabels);
    };

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: 16,
                    width: '90%',
                    maxWidth: 800,
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 28px',
                    borderBottom: '1px solid #e5e5e5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#000' }}>
                            ⚙️ Controles Infográficos & Layout
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#666' }}>
                            Configure hierarquia, destaque, anotações e posicionamento
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: '#f5f5f5',
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 18,
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '28px', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                        {/* Column 1: Infography */}
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#000', borderBottom: '2px solid #0ea5e9', paddingBottom: 8, display: 'inline-block' }}>
                                ✨ Visualização de Dados
                            </h3>

                            {/* Hero Value Selection */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#222' }}>
                                    🎯 Valor Destaque (Hero)
                                </label>
                                <select
                                    value={heroValueIndex ?? ''}
                                    onChange={(e) => setHeroValueIndex(e.target.value === '' ? undefined : parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        fontSize: 14,
                                        borderRadius: 8,
                                        border: '1px solid #ddd',
                                        background: 'white'
                                    }}
                                >
                                    <option value="">Nenhum (usar hierarquia automática)</option>
                                    {chartData.labels.map((label, index) => (
                                        <option key={index} value={index}>
                                            {label} ({chartData.datasets[0]?.data[index] || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Annotations Toggle */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: '#f8f9fa',
                                    borderRadius: 10,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>🏷️ Anotações (Badges)</span>
                                    <button
                                        onClick={() => setShowValueAnnotations(!showValueAnnotations)}
                                        style={{
                                            position: 'relative',
                                            width: 44,
                                            height: 24,
                                            background: showValueAnnotations ? '#0ea5e9' : '#cbd5e1',
                                            border: 'none',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: showValueAnnotations ? 22 : 2,
                                            width: 20,
                                            height: 20,
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s'
                                        }} />
                                    </button>
                                </div>

                                {showValueAnnotations && heroValueIndex !== undefined && (
                                    <div style={{ marginTop: 12, paddingLeft: 8 }}>
                                        <input
                                            type="text"
                                            value={annotationLabels[heroValueIndex] || ''}
                                            onChange={(e) => updateAnnotationLabel(heroValueIndex, e.target.value)}
                                            placeholder="Ex: MAIOR CRESCIMENTO"
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                fontSize: 12,
                                                borderRadius: 6,
                                                border: '1px solid #ddd',
                                                textTransform: 'uppercase',
                                                fontWeight: 600
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Delta Percent Toggle */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: '#f8f9fa',
                                    borderRadius: 10,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>📊 Delta % vs Média</span>
                                    <button
                                        onClick={() => setShowDeltaPercent(!showDeltaPercent)}
                                        style={{
                                            position: 'relative',
                                            width: 44,
                                            height: 24,
                                            background: showDeltaPercent ? '#8b5cf6' : '#cbd5e1',
                                            border: 'none',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: showDeltaPercent ? 22 : 2,
                                            width: 20,
                                            height: 20,
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s'
                                        }} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Layout & Intelligence */}
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#000', borderBottom: '2px solid #8b5cf6', paddingBottom: 8, display: 'inline-block' }}>
                                📐 Layout & Inteligência
                            </h3>

                            {/* Legend Position */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#222' }}>
                                    📁 Posição da Legenda
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                    {(['top', 'bottom', 'left', 'right', 'none'] as const).map((pos) => (
                                        <button
                                            key={pos}
                                            onClick={() => setLegendPosition(pos)}
                                            style={{
                                                padding: '8px 4px',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                borderRadius: 8,
                                                border: '1px solid',
                                                borderColor: legendPosition === pos ? '#8b5cf6' : '#ddd',
                                                background: legendPosition === pos ? '#f5f3ff' : 'white',
                                                color: legendPosition === pos ? '#7c3aed' : '#666',
                                                cursor: 'pointer',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {pos === 'none' ? 'Ocultar' : pos}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Smart Toggles Section */}
                            <div style={{ marginTop: 32 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🤖 Automáticos (Fase 3)
                                </h4>

                                {/* Auto Extremes Toggle */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: '#f8f9fa',
                                    borderRadius: 10,
                                    border: '1px solid #e9ecef',
                                    marginBottom: 12
                                }}>
                                    <div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>🏆 Destacar Extremos</span>
                                        <span style={{ fontSize: 11, color: '#666' }}>Auto detecta Máx / Mín</span>
                                    </div>
                                    <button
                                        onClick={() => setShowExtremes(!showExtremes)}
                                        style={{
                                            position: 'relative',
                                            width: 44,
                                            height: 24,
                                            background: showExtremes ? '#10b981' : '#cbd5e1',
                                            border: 'none',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: showExtremes ? 22 : 2,
                                            width: 20,
                                            height: 20,
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s'
                                        }} />
                                    </button>
                                </div>

                                {/* Metadata Support Toggle */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 14px',
                                    background: '#f8f9fa',
                                    borderRadius: 10,
                                    border: '1px solid #e9ecef'
                                }}>
                                    <div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>🏷️ Usar Metadados</span>
                                        <span style={{ fontSize: 11, color: '#666' }}>Lê anotações do JSON</span>
                                    </div>
                                    <button
                                        onClick={() => setUseMetadata(!useMetadata)}
                                        style={{
                                            position: 'relative',
                                            width: 44,
                                            height: 24,
                                            background: useMetadata ? '#10b981' : '#cbd5e1',
                                            border: 'none',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: useMetadata ? 22 : 2,
                                            width: 20,
                                            height: 20,
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s'
                                        }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 28px',
                    borderTop: '1px solid #e5e5e5',
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                    flexShrink: 0
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            fontSize: 14,
                            fontWeight: 600,
                            border: '1px solid #ddd',
                            background: 'white',
                            borderRadius: 8,
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 24px',
                            fontSize: 14,
                            fontWeight: 600,
                            border: 'none',
                            background: '#0f172a',
                            color: 'white',
                            borderRadius: 8,
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        Aplicar Configurações
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
