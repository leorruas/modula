import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChartData, NumberFormatConfig } from '@/types';

interface InfographicControlsModalProps {
    isOpen: boolean;
    onClose: () => void;
    chartData: ChartData;
    chartType?: string;
    currentConfig?: {
        heroValueIndex?: number;
        showValueAnnotations?: boolean;
        showDeltaPercent?: boolean;
        annotationLabels?: string[];
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        showExtremes?: boolean;
        useMetadata?: boolean;
        showAllLabels?: boolean;

        sortSlices?: boolean;
        autoSort?: boolean;
        datasetTypes?: ('bar' | 'line')[];
        stacked?: boolean;
        useDualAxis?: boolean;
        y2AxisLabel?: string;
        numberFormat?: { type: 'number' | 'percent' | 'currency'; currency?: 'BRL' | 'USD' | 'EUR' | 'GBP'; decimals?: number };
        secondaryNumberFormat?: { type: 'number' | 'percent' | 'currency'; currency?: 'BRL' | 'USD' | 'EUR' | 'GBP'; decimals?: number };
        labelLayout?: 'radial' | 'column-left' | 'column-right' | 'balanced';
        showLabelsCategory?: boolean;
    };
    onSave: (config: {
        heroValueIndex?: number;
        showValueAnnotations?: boolean;
        showDeltaPercent?: boolean;
        annotationLabels?: string[];
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        showExtremes?: boolean;
        useMetadata?: boolean;
        showAllLabels?: boolean;

        sortSlices?: boolean;
        autoSort?: boolean;
        datasetTypes?: ('bar' | 'line')[];
        stacked?: boolean;
        useDualAxis?: boolean;
        y2AxisLabel?: string;
        numberFormat?: { type: 'number' | 'percent' | 'currency'; currency?: 'BRL' | 'USD' | 'EUR' | 'GBP'; decimals?: number };
        secondaryNumberFormat?: { type: 'number' | 'percent' | 'currency'; currency?: 'BRL' | 'USD' | 'EUR' | 'GBP'; decimals?: number };
        labelLayout?: 'radial' | 'column-left' | 'column-right' | 'balanced';
        showLabelsCategory?: boolean;
    }) => void;
}

export function InfographicControlsModal({
    isOpen,
    onClose,
    chartData,
    chartType = 'column',
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
    const [showAllLabels, setShowAllLabels] = useState(currentConfig.showAllLabels || false);
    const [sortSlices, setSortSlices] = useState(currentConfig.sortSlices || false);
    const [autoSort, setAutoSort] = useState(currentConfig.autoSort || false);
    const [stacked, setStacked] = useState(currentConfig.stacked || false);
    const [useDualAxis, setUseDualAxis] = useState(currentConfig.useDualAxis || false);
    const [y2AxisLabel, setY2AxisLabel] = useState(currentConfig.y2AxisLabel || '');
    const [numberFormat, setNumberFormat] = useState<NumberFormatConfig>(currentConfig.numberFormat || { type: 'number' });
    const [secondaryNumberFormat, setSecondaryNumberFormat] = useState<NumberFormatConfig>(currentConfig.secondaryNumberFormat || { type: 'percent' });
    const [labelLayout, setLabelLayout] = useState<'radial' | 'column-left' | 'column-right' | 'balanced'>(currentConfig.labelLayout || 'radial');
    const [showLabelsCategory, setShowLabelsCategory] = useState(currentConfig.showLabelsCategory !== false);


    // Initialize with existing config OR fallback logic
    const [datasetTypes, setDatasetTypes] = useState<('bar' | 'line')[]>(() => {
        if (currentConfig.datasetTypes) return currentConfig.datasetTypes;
        if (chartType === 'mixed') {
            const count = chartData.datasets.length;
            return chartData.datasets.map((_, i) => (count > 1 && i === count - 1 ? 'line' : 'bar'));
        }
        return [];
    });

    const [showAllOptions, setShowAllOptions] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setHeroValueIndex(currentConfig.heroValueIndex);
            setShowValueAnnotations(currentConfig.showValueAnnotations || false);
            setShowDeltaPercent(currentConfig.showDeltaPercent || false);
            setAnnotationLabels(currentConfig.annotationLabels || []);
            setLegendPosition(currentConfig.legendPosition || 'bottom');
            setShowExtremes(currentConfig.showExtremes || false);
            setUseMetadata(currentConfig.useMetadata || false);
            setShowAllLabels(currentConfig.showAllLabels || false);
            setSortSlices(currentConfig.sortSlices || false);

            setAutoSort(currentConfig.autoSort || false);
            setStacked(currentConfig.stacked || false);
            setUseDualAxis(currentConfig.useDualAxis || false);
            setY2AxisLabel(currentConfig.y2AxisLabel || '');
            setNumberFormat(currentConfig.numberFormat || { type: 'number' });
            setSecondaryNumberFormat(currentConfig.secondaryNumberFormat || { type: 'percent' });
            setLabelLayout(currentConfig.labelLayout || 'radial');
            setShowLabelsCategory(currentConfig.showLabelsCategory !== false);
            if (currentConfig.datasetTypes) {

                setDatasetTypes(currentConfig.datasetTypes);
            } else if (chartType === 'mixed') {
                const count = chartData.datasets.length;
                setDatasetTypes(chartData.datasets.map((_, i) => (count > 1 && i === count - 1 ? 'line' : 'bar')));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            heroValueIndex,
            showValueAnnotations,
            showDeltaPercent,
            annotationLabels: annotationLabels.length > 0 ? annotationLabels : undefined,
            legendPosition,
            showExtremes,
            useMetadata,
            showAllLabels,
            sortSlices,
            autoSort, // Added
            datasetTypes: chartType === 'mixed' ? datasetTypes : undefined,
            stacked: chartType === 'mixed' ? stacked : undefined,
            useDualAxis: chartType === 'mixed' ? useDualAxis : undefined,
            y2AxisLabel: chartType === 'mixed' && useDualAxis ? y2AxisLabel : undefined,
            secondaryNumberFormat: (chartType === 'mixed' && useDualAxis) ? secondaryNumberFormat as any : undefined,
            labelLayout,
            showLabelsCategory,
            numberFormat  // Pass the updated numberFormat explicitly
        });
        onClose();
    };

    const updateAnnotationLabel = (index: number, value: string) => {
        const newLabels = [...annotationLabels];
        newLabels[index] = value;
        setAnnotationLabels(newLabels);
    };

    const toggleDatasetType = (index: number) => {
        const newTypes = [...datasetTypes];
        newTypes[index] = newTypes[index] === 'bar' ? 'line' : 'bar';
        setDatasetTypes(newTypes);
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
                    {/* Smart UI Toggle */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowAllOptions(!showAllOptions)}
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: showAllOptions ? '#0ea5e9' : '#666',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {showAllOptions ? '🎯 Ver Apenas Sugeridos' : '🛠️ Ver Todas as Opções'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                        {/* Column 1: Infography */}
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#000', borderBottom: '2px solid #0ea5e9', paddingBottom: 8, display: 'inline-block' }}>
                                ✨ Destaques & Narração
                            </h3>

                            {/* Mixed Chart: Dataset Type Configuration */}
                            {chartType === 'mixed' && (
                                <div style={{ marginBottom: 24, padding: '12px 14px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e9ecef' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>📶 Empilhar Barras</span>
                                            <span style={{ fontSize: 11, color: '#666' }}>Juntar valores em uma única coluna</span>
                                        </div>
                                        <button
                                            onClick={() => setStacked(!stacked)}
                                            style={{
                                                position: 'relative',
                                                width: 44,
                                                height: 24,
                                                background: stacked ? '#3b82f6' : '#cbd5e1',
                                                border: 'none',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 2,
                                                left: stacked ? 22 : 2,
                                                width: 20,
                                                height: 20,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    </div>

                                    {/* Dual Axis Toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>⚖️ Eixo Y Secundário</span>
                                            <span style={{ fontSize: 11, color: '#666' }}>Escala independente para Linhas</span>
                                        </div>
                                        <button
                                            onClick={() => setUseDualAxis(!useDualAxis)}
                                            style={{
                                                position: 'relative',
                                                width: 44,
                                                height: 24,
                                                background: useDualAxis ? '#0ea5e9' : '#cbd5e1',
                                                border: 'none',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 2,
                                                left: useDualAxis ? 22 : 2,
                                                width: 20,
                                                height: 20,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    </div>

                                    {useDualAxis && (
                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Título do Eixo Direito</label>
                                            <input
                                                type="text"
                                                value={y2AxisLabel}
                                                onChange={e => setY2AxisLabel(e.target.value)}
                                                placeholder="Ex: Meta (%)"
                                                style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                            />
                                        </div>
                                    )}

                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 8 }}>Tipos de Série</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {chartData.datasets.map((ds, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: '#555' }}>
                                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#888', marginRight: 6 }}></span>
                                                    {ds.label || `Dataset ${i + 1}`}
                                                </span>
                                                <button
                                                    onClick={() => toggleDatasetType(i)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        background: datasetTypes[i] === 'bar' ? '#e0f2fe' : '#fef3c7',
                                                        color: datasetTypes[i] === 'bar' ? '#0369a1' : '#b45309',
                                                        border: '1px solid',
                                                        borderColor: datasetTypes[i] === 'bar' ? '#bae6fd' : '#fde68a',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        width: 60
                                                    }}
                                                >
                                                    {datasetTypes[i] === 'bar' ? 'Barra' : 'Linha'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Number Format Configuration */}
                            <div style={{ marginBottom: 24, padding: '12px 14px', background: '#f8f9fa', borderRadius: 10, border: '1px solid #e9ecef' }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    🔢 Formato dos Valores
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Tipo</label>
                                        <select
                                            value={numberFormat?.type || 'number'}
                                            onChange={e => setNumberFormat({ ...numberFormat, type: e.target.value as any })}
                                            style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                        >
                                            <option value="number">Número (1.234)</option>
                                            <option value="percent">Porcentagem (50%)</option>
                                            <option value="currency">Moeda (R$ 10,00)</option>
                                        </select>
                                    </div>

                                    {numberFormat?.type === 'currency' && (
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Moeda</label>
                                            <select
                                                value={numberFormat?.currency || 'BRL'}
                                                onChange={e => setNumberFormat({ ...numberFormat, currency: e.target.value as any })}
                                                style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                            >
                                                <option value="BRL">Real (R$)</option>
                                                <option value="USD">Dólar ($)</option>
                                                <option value="EUR">Euro (€)</option>
                                                <option value="GBP">Libra (£)</option>
                                            </select>
                                        </div>
                                    )}

                                    {numberFormat?.type !== 'currency' && (
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }}>Decimais</label>
                                            <input
                                                type="number"
                                                min="0" max="4"
                                                value={numberFormat?.decimals ?? ''}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value);
                                                    setNumberFormat({ ...numberFormat, decimals: isNaN(val) ? undefined : val });
                                                }}
                                                placeholder={numberFormat?.type === 'percent' ? "0" : "auto"}
                                                style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {numberFormat?.type === 'percent' && (
                                    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="checkbox"
                                            id="useScale"
                                            checked={numberFormat?.scale === 0.01}
                                            onChange={e => setNumberFormat({ ...numberFormat, scale: e.target.checked ? 0.01 : undefined })}
                                        />
                                        <label htmlFor="useScale" style={{ fontSize: 12, color: '#444', cursor: 'pointer' }}>
                                            O valor já é porcentagem (ex: 50 = 50%)
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* SECONDARY FORMAT for Dual Axis */}
                            {chartType === 'mixed' && useDualAxis && (
                                <div style={{ marginBottom: 24, padding: '12px 14px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ddd6fe' }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🔢 Formato das Linhas (Eixo Direito)
                                    </h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', display: 'block', marginBottom: 4 }}>Tipo</label>
                                            <select
                                                value={secondaryNumberFormat?.type || 'percent'}
                                                onChange={e => setSecondaryNumberFormat({ ...secondaryNumberFormat, type: e.target.value as any })}
                                                style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                            >
                                                <option value="number">Número (1.234)</option>
                                                <option value="percent">Porcentagem (50%)</option>
                                                <option value="currency">Moeda (R$ 10,00)</option>
                                            </select>
                                        </div>

                                        {secondaryNumberFormat?.type === 'currency' && (
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', display: 'block', marginBottom: 4 }}>Moeda</label>
                                                <select
                                                    value={secondaryNumberFormat?.currency || 'BRL'}
                                                    onChange={e => setSecondaryNumberFormat({ ...secondaryNumberFormat, currency: e.target.value as any })}
                                                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                                >
                                                    <option value="BRL">Real (R$)</option>
                                                    <option value="USD">Dólar ($)</option>
                                                    <option value="EUR">Euro (€)</option>
                                                    <option value="GBP">Libra (£)</option>
                                                </select>
                                            </div>
                                        )}

                                        {secondaryNumberFormat?.type !== 'currency' && (
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', display: 'block', marginBottom: 4 }}>Decimais</label>
                                                <input
                                                    type="number"
                                                    min="0" max="4"
                                                    value={secondaryNumberFormat?.decimals ?? ''}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value);
                                                        setSecondaryNumberFormat({ ...secondaryNumberFormat, decimals: isNaN(val) ? undefined : val });
                                                    }}
                                                    placeholder={secondaryNumberFormat?.type === 'percent' ? "0" : "auto"}
                                                    style={{ width: '100%', padding: '6px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {secondaryNumberFormat?.type === 'percent' && (
                                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="checkbox"
                                                id="useScaleSecondary"
                                                checked={secondaryNumberFormat?.scale === 0.01}
                                                onChange={e => setSecondaryNumberFormat({ ...secondaryNumberFormat, scale: e.target.checked ? 0.01 : undefined })}
                                            />
                                            <label htmlFor="useScaleSecondary" style={{ fontSize: 12, color: '#444', cursor: 'pointer' }}>
                                                O valor já é porcentagem (ex: 50 = 50%)
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Hero Value Selection */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#222' }}>
                                    {chartType === 'radar' ? '🎯 Eixo Dominante (Hero)' : (chartType.includes('pie') ? '🍕 Fatiada em Destaque' : '🎯 Ponto Focal (Hero)')}
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
                                <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                                    {chartType === 'radar' ? 'O eixo selecionado ganhará um "Halo" e traço reforçado.' : 'O valor terá tipografia boost e efeitos visuais exclusivos.'}
                                </p>
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
                                    <div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>🏷️ Badge de Destaque</span>
                                        <span style={{ fontSize: 11, color: '#666' }}>Selo editorial sobre o valor Hero</span>
                                    </div>
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
                                            placeholder="Ex: META ALCANÇADA"
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                fontSize: 12,
                                                borderRadius: 6,
                                                border: '1px solid #ddd',
                                                textTransform: 'uppercase',
                                                fontWeight: 800
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Delta Percent Toggle - Only for logic-heavy charts or if Show All */}
                            {(showAllOptions || ['column', 'line', 'area', 'radar'].includes(chartType)) && (
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
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>📊 Indicadores de Variação</span>
                                            <span style={{ fontSize: 11, color: '#666' }}>{chartType === 'area' || chartType === 'line' ? 'Delta vs Início' : 'Delta vs Média'}</span>
                                        </div>
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
                            )}
                        </div>

                        {/* Column 2: Layout & Intelligence */}
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#000', borderBottom: '2px solid #8b5cf6', paddingBottom: 8, display: 'inline-block' }}>
                                📏 Inteligência de Layout
                            </h3>

                            {/* Legend Position */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <label style={{ fontSize: 14, fontWeight: 600, color: '#222' }}>
                                        📁 Legenda & Posição
                                    </label>

                                    {/* Quick Toggle for Visibility */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 11, color: '#666' }}>{legendPosition === 'none' ? 'Oculta' : 'Visível'}</span>
                                        <button
                                            onClick={() => setLegendPosition(legendPosition === 'none' ? 'bottom' : 'none')}
                                            style={{
                                                position: 'relative',
                                                width: 36,
                                                height: 20,
                                                background: legendPosition !== 'none' ? '#8b5cf6' : '#cbd5e1',
                                                border: 'none',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 2,
                                                left: legendPosition !== 'none' ? 18 : 2,
                                                width: 16,
                                                height: 16,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 8,
                                    opacity: legendPosition === 'none' ? 0.5 : 1,
                                    pointerEvents: legendPosition === 'none' ? 'none' : 'auto',
                                    transition: 'opacity 0.2s'
                                }}>
                                    {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
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
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Label Layout (Pie/Donut Only) */}
                            {(chartType.includes('pie') || chartType.includes('donut')) && (
                                <div style={{ marginBottom: 24, marginTop: 24, borderTop: '1px solid #eee', paddingTop: 24 }}>
                                    <label style={{ fontSize: 13, fontWeight: 700, color: '#444', marginBottom: 10, display: 'block' }}>
                                        🕸️ Disposição dos Rótulos (Layout)
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                        {[
                                            { id: 'radial', label: 'Radial' },
                                            { id: 'balanced', label: 'Balanc.' },
                                            { id: 'column-left', label: 'Esq.' },
                                            { id: 'column-right', label: 'Dir.' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setLabelLayout(opt.id as any)}
                                                style={{
                                                    padding: '8px 4px',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    borderRadius: 8,
                                                    border: '1px solid',
                                                    borderColor: labelLayout === opt.id ? '#8b5cf6' : '#ddd',
                                                    background: labelLayout === opt.id ? '#f5f3ff' : 'white',
                                                    color: labelLayout === opt.id ? '#7c3aed' : '#666',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: labelLayout === opt.id ? '0 1px 2px rgba(139, 92, 246, 0.2)' : 'none'
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                                        Alternativa para gráficos com muitos dados pequenos ou rótulos longos.
                                    </p>

                                    {/* Show Category Toggle (Values Only Mode) */}
                                    <div style={{
                                        marginTop: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        background: '#f0f9ff',
                                        borderRadius: 8,
                                        border: '1px solid #bae6fd'
                                    }}>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', display: 'block' }}>🏷️ Texto da Categoria</span>
                                            <span style={{ fontSize: 11, color: '#0369a1', opacity: 0.8 }}>Ocultar para economizar espaço (Apenas Números)</span>
                                        </div>
                                        <button
                                            onClick={() => setShowLabelsCategory(!showLabelsCategory)}
                                            style={{
                                                position: 'relative',
                                                width: 40,
                                                height: 20,
                                                background: showLabelsCategory ? '#0ea5e9' : '#cbd5e1',
                                                border: 'none',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 2,
                                                left: showLabelsCategory ? 22 : 2,
                                                width: 16,
                                                height: 16,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Smart Toggles Section */}
                            <div style={{ marginTop: 32 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#666', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    🤖 Gatilhos Automáticos
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
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>🏆 Marcar Extremos</span>
                                        <span style={{ fontSize: 11, color: '#666' }}>Badges automáticas de Máx / Mín</span>
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
                                    border: '1px solid #e9ecef',
                                    marginBottom: 12
                                }}>
                                    <div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>🎯 Eventos & Metadados</span>
                                        <span style={{ fontSize: 11, color: '#666' }}>{chartType === 'area' ? 'Marcos verticais (milestones)' : 'Exibir notas extras do JSON'}</span>
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

                                {/* Show All Labels Override */}
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
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>🏷️ Exibir Todos os Rótulos</span>
                                        <span style={{ fontSize: 11, color: '#666' }}>Desativar inteligência que oculta rótulos</span>
                                    </div>
                                    <button
                                        onClick={() => setShowAllLabels(!showAllLabels)}
                                        style={{
                                            position: 'relative',
                                            width: 44,
                                            height: 24,
                                            background: showAllLabels ? '#0ea5e9' : '#cbd5e1',
                                            border: 'none',
                                            borderRadius: 12,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: 2,
                                            left: showAllLabels ? 22 : 2,
                                            width: 20,
                                            height: 20,
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s'
                                        }} />
                                    </button>
                                </div>

                                {/* Sort Slices Toggle */}
                                {(chartType.includes('pie') || chartType.includes('donut')) && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: '#f8f9fa',
                                        borderRadius: 10,
                                        border: '1px solid #e9ecef',
                                        marginTop: 12
                                    }}>
                                        <div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#222', display: 'block' }}>📶 Ordenar Fatias</span>
                                            <span style={{ fontSize: 11, color: '#666' }}>Do maior para o menor</span>
                                        </div>
                                        <button
                                            onClick={() => setSortSlices(!sortSlices)}
                                            style={{
                                                position: 'relative',
                                                width: 44,
                                                height: 24,
                                                background: sortSlices ? '#0ea5e9' : '#cbd5e1',
                                                border: 'none',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                padding: 0
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 2,
                                                left: sortSlices ? 22 : 2,
                                                width: 20,
                                                height: 20,
                                                background: 'white',
                                                borderRadius: '50%',
                                                transition: 'left 0.2s'
                                            }} />
                                        </button>
                                    </div>
                                )}
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

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
}
