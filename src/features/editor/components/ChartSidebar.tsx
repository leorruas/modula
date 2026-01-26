import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useUserStore } from '@/store/userStore';
import { chartService } from '@/services/chartService';
import { projectService } from '@/services/projectService';
import { userPreferencesService } from '@/services/userPreferencesService';
import { ChartType, NumberFormatConfig } from '@/types';
import { toast } from 'sonner';
import { DataEditorModal } from './DataEditorModal';
import { InfographicControlsModal } from './InfographicControlsModal';
import { recommendChartType, getRecommendationReason } from '@/services/chartRecommendationService';
import { generateMonochromaticPalette } from '@/utils/colors';
import { COLOR_PRESETS, type ColorPresetKey } from '@/utils/chartTheme';
import { IconSelectorModal } from './IconSelectorModal';
import { exportChartToPng } from '@/utils/exportUtils';

interface ChartSidebarProps {
    projectId: string;
}

export function ChartSidebar({ projectId }: ChartSidebarProps) {
    const { selectedModules, triggerRefresh, setSelection, isPreviewMode, editingChartId, setEditingChartId, activePage } = useEditorStore();
    const { user } = useUserStore();
    const [chartType, setChartType] = useState<ChartType>('bar');
    // Default palette
    const [palette, setPalette] = useState<string[]>(['#000000', '#666666', '#cccccc']);
    const [projectColorsLoaded, setProjectColorsLoaded] = useState(false);
    const [fontFamily, setFontFamily] = useState('sans-serif');
    const [notes, setNotes] = useState('');
    const [chartName, setChartName] = useState('');

    const [chartMode, setChartMode] = useState<'classic' | 'infographic'>('classic');
    const [useGradient, setUseGradient] = useState(false);
    const [finish, setFinish] = useState<'standard' | 'glass'>('standard');
    const [colorPreset, setColorPreset] = useState<ColorPresetKey>('vibrantModern');

    const [inputMode, setInputMode] = useState<'csv' | 'json'>('csv');
    const [csvInput, setCsvInput] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [recommendedType, setRecommendedType] = useState<ChartType | null>(null);
    const [recommendationReason, setRecommendationReason] = useState('');

    // Icon states
    const [iconModalOpen, setIconModalOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<{ category: string; iconKey: string } | null>(null);

    // Infographic Controls (Phase 2)
    const [infographicControlsOpen, setInfographicControlsOpen] = useState(false);
    const [infographicConfig, setInfographicConfig] = useState<{
        heroValueIndex?: number;
        showValueAnnotations?: boolean;
        showDeltaPercent?: boolean;
        annotationLabels?: string[];
        legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none';
        showExtremes?: boolean;
        useMetadata?: boolean;
        showAllLabels?: boolean;
        sortSlices?: boolean;
        datasetTypes?: ('bar' | 'line')[];
        stacked?: boolean;
    }>({});
    const [numberFormat, setNumberFormat] = useState<NumberFormatConfig>({ type: 'number' });

    // Data Modal
    const [dataModalOpen, setDataModalOpen] = useState(false);

    const [dataInput, setDataInput] = useState(JSON.stringify({
        labels: ["A", "B", "C", "D"],
        datasets: [{ label: "Dataset 1", data: [10, 20, 15, 25] }]
    }, null, 2));

    // Load defaults and project data
    useEffect(() => {
        const loadInitialData = async () => {
            // 1. Get Project Data
            const project = await projectService.getProject(projectId);
            if (project && project.colors && project.colors.length > 0) {
                setPalette(project.colors);
            }

            // If we are NOT editing a chart, apply defaults from project or user
            if (!editingChartId) {
                // RESET FORM STATE (Fix for "New Page" not resetting sidebar)
                setChartName('');
                setNotes('');
                setDataInput(JSON.stringify({
                    labels: ["A", "B", "C", "D"],
                    datasets: [{ label: "Dataset 1", data: [10, 20, 15, 25] }]
                }, null, 2));
                setChartType('bar');
                setChartMode('classic');
                setUseGradient(false);
                setFinish('standard');
                setInfographicConfig({});
                setSelectedIcon(null);
                setCsvInput('');
                setInputMode('csv');
                setRecommendedType(null);
                setRecommendationReason('');

                if (project?.defaultStyle) {
                    // Apply Project Defaults
                    if (project.defaultStyle.fontFamily) setFontFamily(project.defaultStyle.fontFamily);
                    if (project.defaultStyle.mode) setChartMode(project.defaultStyle.mode);
                    if (project.defaultStyle.useGradient !== undefined) setUseGradient(project.defaultStyle.useGradient);
                    if (project.defaultStyle.finish) setFinish(project.defaultStyle.finish);
                } else if (user) {
                    // Apply User Defaults if no project defaults
                    const prefs = await userPreferencesService.getUserPreferences(user.uid);
                    if (prefs?.defaultStyle) {
                        if (prefs.defaultStyle.fontFamily) setFontFamily(prefs.defaultStyle.fontFamily);
                        if (prefs.defaultStyle.mode) setChartMode(prefs.defaultStyle.mode);
                        if (prefs.defaultStyle.useGradient !== undefined) setUseGradient(prefs.defaultStyle.useGradient);
                        if (prefs.defaultStyle.finish) setFinish(prefs.defaultStyle.finish);
                    }
                }
            }
            setProjectColorsLoaded(true);
        };

        loadInitialData();
    }, [projectId, user, editingChartId, activePage]);

    // Mock Data Generator
    const getMockDataForType = (type: ChartType) => {
        const labels = ["A", "B", "C", "D"];

        if (type === 'bar' || type === 'column') {
            return {
                labels: ["Produto A", "Produto B", "Produto C", "Produto D"],
                datasets: [
                    { label: "Vendas 2023", data: [45, 70, 55, 85] },
                    { label: "Vendas 2024", data: [60, 80, 65, 95] }
                ],
                xAxisLabel: "Unidades Vendidas",
                yAxisLabel: "Produtos"
            };
        }

        if (type === 'line') {
            return {
                labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                datasets: [
                    { label: "Receita", data: [30, 45, 40, 60, 55, 75] },
                    { label: "Despesas", data: [20, 35, 30, 40, 45, 50] }
                ],
                xAxisLabel: "Mês",
                yAxisLabel: "Valor (R$ mil)"
            };
        }

        if (type === 'area') {
            return {
                labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
                datasets: [
                    { label: "Produto A", data: [20, 25, 30, 35, 40, 45] },
                    { label: "Produto B", data: [15, 20, 25, 30, 35, 40] },
                    { label: "Produto C", data: [10, 15, 20, 25, 30, 35] }
                ]
            };
        }

        if (type === 'pie' || type === 'donut') {
            return {
                labels: ["Desktop", "Mobile", "Tablet", "Outros"],
                datasets: [
                    { label: "Acessos", data: [45, 30, 15, 10] }
                ]
            };
        }

        if (type === 'scatter') {
            return {
                labels: ["1", "2", "3", "4", "5", "6"],
                datasets: [
                    { label: "Correlação X/Y", data: [10, 25, 15, 35, 30, 45] }
                ]
            };
        }

        if (type === 'bubble') {
            return {
                labels: ["A", "B", "C", "D", "E"],
                datasets: [
                    { label: "Tamanho da Bolha", data: [15, 30, 20, 40, 25] }
                ]
            };
        }

        if (type === 'radar') {
            return {
                labels: ["Velocidade", "Precisão", "Força", "Resistência", "Técnica"],
                datasets: [
                    { label: "Jogador A", data: [80, 90, 70, 85, 75] },
                    { label: "Jogador B", data: [70, 85, 90, 75, 80] }
                ]
            };
        }

        if (type === 'histogram') {
            return {
                labels: ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-70", "70-80", "80-90", "90-100"],
                datasets: [
                    { label: "Frequência", data: [5, 12, 18, 25, 30, 22, 15, 8, 3, 2] }
                ]
            };
        }

        if (type === 'boxplot') {
            return {
                labels: ["Grupo A", "Grupo B", "Grupo C", "Grupo D"],
                datasets: [
                    { label: "Min", data: [10, 20, 15, 25] },
                    { label: "Q1", data: [20, 30, 25, 35] },
                    { label: "Median", data: [40, 50, 45, 55] },
                    { label: "Q3", data: [60, 70, 65, 75] },
                    { label: "Max", data: [80, 90, 85, 95] }
                ]
            };
        }

        if (type === 'mixed') {
            return {
                labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
                datasets: [
                    { label: "Produto A (Barra)", data: [65, 59, 80, 81, 56, 55] },
                    { label: "Produto B (Barra)", data: [28, 48, 40, 19, 86, 27] },
                    { label: "Meta (Linha)", data: [45, 55, 60, 50, 70, 40] }
                ]
            };
        }

        if (type === 'gauge') {
            return {
                labels: ["Meta"],
                datasets: [
                    { label: "Vendas", data: [75, 100] }
                ]
            };
        }

        // Default
        return {
            labels,
            datasets: [{ label: "Dataset 1", data: [10, 20, 15, 25] }]
        };
    };

    // Load chart data when editing
    useEffect(() => {
        if (editingChartId) {
            chartService.getProjectCharts(projectId).then(charts => {
                const chart = charts.find(c => c.id === editingChartId);
                if (chart) {
                    setChartType(chart.type);
                    setNotes(chart.notes || '');
                    setPalette(chart.style?.colorPalette || ['#000000']);
                    setFontFamily(chart.style?.fontFamily || 'sans-serif');
                    if (chart.style?.mode) {
                        setChartMode(chart.style.mode);
                    }
                    if (chart.style?.useGradient !== undefined) {
                        setUseGradient(chart.style.useGradient);
                    }
                    if (chart.style?.finish) {
                        setFinish(chart.style.finish);
                    }
                    if (chart.style?.infographicConfig) {
                        setInfographicConfig({
                            ...chart.style.infographicConfig,
                            datasetTypes: chart.style.datasetTypes,
                            stacked: chart.style.stacked
                        });
                    } else if (chart.style?.datasetTypes) {
                        setInfographicConfig(prev => ({ ...prev, datasetTypes: chart.style?.datasetTypes, stacked: chart.style?.stacked }));
                    }
                    if (chart.style?.numberFormat) {
                        setNumberFormat(chart.style.numberFormat);
                    } else {
                        setNumberFormat({ type: 'number' });
                    }
                    setDataInput(JSON.stringify(chart.data, null, 2));
                    setChartName(chart.name || '');
                }
            });
        }
    }, [editingChartId, projectId]);

    const handleTypeChange = (newType: ChartType) => {
        setChartType(newType);

        // Auto-select default icon for Pictogram if none selected
        if (newType === 'pictogram' && !selectedIcon) {
            setSelectedIcon({ category: 'people', iconKey: 'person' });
        }
    };

    const parseCSV = (csv: string) => {
        try {
            const lines = csv.trim().split('\n');
            if (lines.length < 2) return;

            const headers = lines[0].split(',').map(h => h.trim());
            const labels: string[] = [];
            const datasetsData: number[][] = headers.slice(1).map(() => []);

            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim());
                labels.push(parts[0]);
                for (let j = 1; j < parts.length; j++) {
                    if (datasetsData[j - 1]) {
                        datasetsData[j - 1].push(Number(parts[j]) || 0);
                    }
                }
            }

            const datasets = headers.slice(1).map((header, index) => ({
                label: header,
                data: datasetsData[index]
            }));

            const data = { labels, datasets };
            setDataInput(JSON.stringify(data, null, 2));

            // Generate Recommendation
            const rec = recommendChartType(data);
            if (rec && rec !== chartType) {
                setRecommendedType(rec);
                setRecommendationReason(getRecommendationReason(rec));
            } else {
                setRecommendedType(null);
                setRecommendationReason('');
            }
            toast.success("CSV processado com sucesso!");
        } catch (e) {
            console.error("CSV Parse Error", e);
            toast.error("Erro ao processar CSV");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCsvInput(text);
                parseCSV(text);
            };
            reader.readAsText(file);
        } else {
            toast.error("Por favor, solte um arquivo .csv válido");
        }
    };

    const handleCreate = async () => {
        if (selectedModules.length === 0) {
            alert("Selecione módulos no grid primeiro!");
            return;
        }

        const minR = Math.min(...selectedModules.map(m => m.r));
        const maxR = Math.max(...selectedModules.map(m => m.r));
        const minC = Math.min(...selectedModules.map(m => m.c));
        const maxC = Math.max(...selectedModules.map(m => m.c));

        const w = maxC - minC + 1;
        const h = maxR - minR + 1;

        console.log('📐 Creating chart:', {
            selectedModulesCount: selectedModules.length,
            selectedModules,
            minR, maxR, minC, maxC,
            calculatedW: w,
            calculatedH: h
        });

        try {
            const parsedData = JSON.parse(dataInput);
            await chartService.createChart(projectId, {
                name: chartName || `Gráfico ${Date.now()}`,
                type: chartType,
                notes,
                page: activePage, // Assign current active page
                module: {
                    x: minC,
                    y: minR,
                    w,
                    h
                },
                data: {
                    ...parsedData,
                    ...(selectedIcon ? {
                        iconConfig: {
                            category: selectedIcon.category,
                            iconKey: selectedIcon.iconKey,
                            enabled: true,
                            position: 'left'
                        }
                    } : {})
                },
                style: {
                    colorPalette: palette,
                    fontFamily,
                    mode: chartMode,
                    useGradient,
                    finish,
                    infographicConfig: chartMode === 'infographic' ? (() => {
                        const { datasetTypes, stacked, ...rest } = infographicConfig;
                        return rest;
                    })() : undefined,
                    datasetTypes: infographicConfig.datasetTypes,
                    stacked: infographicConfig.stacked,
                    numberFormat
                }
            });
            triggerRefresh();
            setSelection([]); // Clear selection after create
            toast.success("Gráfico criado com sucesso!");
        } catch (e) {
            if (e instanceof SyntaxError) {
                toast.error("JSON de dados inválido");
            } else {
                console.error('Error creating chart:', e);
                toast.error(`Erro ao criar gráfico: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
            }
        }
    };

    const handleUpdate = async () => {
        if (!editingChartId) return;
        try {
            const parsedData = JSON.parse(dataInput);
            await chartService.updateChart(editingChartId, {
                ...(chartName ? { name: chartName } : {}), // Only update name if provided
                type: chartType,
                notes,
                data: {
                    ...parsedData,
                    ...(selectedIcon ? {
                        iconConfig: {
                            category: selectedIcon.category,
                            iconKey: selectedIcon.iconKey,
                            enabled: true,
                            position: 'left'
                        }
                    } : {})
                },
                style: {
                    colorPalette: palette,
                    fontFamily,
                    mode: chartMode,
                    useGradient,
                    finish,
                    infographicConfig: chartMode === 'infographic' ? (() => {
                        const { datasetTypes, stacked, ...rest } = infographicConfig;
                        return rest;
                    })() : undefined,
                    datasetTypes: infographicConfig.datasetTypes,
                    stacked: infographicConfig.stacked,
                    numberFormat
                }
            });
            triggerRefresh();
            setEditingChartId(null); // Exit edit mode
            toast.success("Gráfico atualizado");
        } catch (e) {
            if (e instanceof SyntaxError) {
                toast.error("JSON de dados inválido");
            } else {
                console.error('Error updating chart:', e);
                toast.error(`Erro ao atualizar: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
            }
        }
    };

    const generatePalette = () => {
        if (palette.length === 0) return;
        const newPalette = generateMonochromaticPalette(palette[0], 5);
        setPalette(newPalette);
        toast.success("Paleta monocromática gerada!");
    };

    const handleDelete = async () => {
        if (!editingChartId) return;
        if (confirm("Tem certeza que deseja excluir este gráfico?")) {
            await chartService.deleteChart(editingChartId);
            triggerRefresh();
            setEditingChartId(null);
            toast.success("Gráfico removido");
        }
    }
    // ... (imports and other functions are fine at top, this replaces the messed up block in body if it was there, effectively cleaning it up)




    const saveProjectDefaults = async () => {
        try {
            await projectService.updateProject(projectId, {
                colors: palette,
                defaultStyle: {
                    fontFamily,
                    mode: chartMode,
                    useGradient,
                    finish
                }
            });
            toast.success("Padrões salvos no projeto");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao salvar padrões");
        }
    };

    const saveUserDefaultPreferences = async () => {
        if (!user) return;
        try {
            await userPreferencesService.saveUserPreferences(user.uid, {
                defaultColors: palette,
                defaultStyle: {
                    fontFamily,
                    mode: chartMode,
                    useGradient,
                    finish
                }
            });
            toast.success("Suas preferências foram salvas");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao salvar preferências");
        }
    };

    const updateColor = (index: number, color: string) => {
        const newPalette = [...palette];
        newPalette[index] = color;
        setPalette(newPalette);
    };

    const addColor = () => {
        setPalette([...palette, '#000000']);
    };

    const removeColor = (index: number) => {
        if (palette.length <= 1) return;
        const newPalette = palette.filter((_, i) => i !== index);
        setPalette(newPalette);
    };

    // Logic for rendering View
    const isEditing = !!editingChartId;
    const isVisible = isEditing || selectedModules.length > 0;

    // Common style for section boxes
    const boxStyle: React.CSSProperties = {
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: '#222',
        marginBottom: 10
    };

    if (isPreviewMode) {
        return null; // Return null effectively hides the component. Or we could animate it out.
    }

    return (
        <div style={{
            position: 'fixed',
            right: 0,
            top: 60, // Align below header
            bottom: 0,
            width: 320,
            background: '#f8f9fa',
            borderLeft: '1px solid #ddd',
            padding: '20px', // Adjusted top padding since it's now below header
            boxShadow: '-5px 0 25px rgba(0,0,0,0.05)',
            overflowY: 'auto',
            zIndex: 500,
            transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth slide
            opacity: isVisible ? 1 : 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                {isEditing && (
                    <button onClick={() => setEditingChartId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#666' }}>←</button>
                )}
                <h2 style={{ fontSize: 24, fontFamily: 'Georgia, serif', margin: 0, color: '#000' }}>
                    {isEditing ? 'Editar Gráfico' : 'Novo Gráfico'}
                </h2>
            </div>

            {!isEditing && (
                <div style={{ ...boxStyle, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <p style={{ fontSize: 13, color: '#3730a3', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>✨</span>
                        <span style={{ fontWeight: 600 }}>{selectedModules.length} módulos selecionados</span>
                    </p>
                </div>
            )}

            {/* SEÇÃO 1: DADOS */}
            <div style={boxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={labelStyle}>Dados do Gráfico</label>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span
                            onClick={() => setInputMode('csv')}
                            style={{ cursor: 'pointer', fontWeight: inputMode === 'csv' ? 600 : 400, textDecoration: inputMode === 'csv' ? 'underline' : 'none', color: inputMode === 'csv' ? '#000' : '#888' }}
                        >
                            CSV Rápido
                        </span>
                    </div>
                </div>

                {/* CSV Input Area */}
                {inputMode === 'csv' && (
                    <>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{ marginBottom: 10 }}
                        >
                            <label
                                htmlFor="csv-upload"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    border: `2px dashed ${isDragging ? '#0ea5e9' : '#ccc'}`,
                                    padding: '24px 16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    color: isDragging ? '#0ea5e9' : '#666',
                                    background: isDragging ? '#f0f9ff' : '#f9f9f9',
                                    transition: 'all 0.2s',
                                    transform: isDragging ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <span style={{ fontSize: 24, marginBottom: 8 }}>{isDragging ? '📂' : '📄'}</span>
                                <span style={{ fontWeight: 600, marginBottom: 4 }}>
                                    {isDragging ? 'Solte para enviar' : 'Clique ou Arraste o CSV'}
                                </span>
                                <span style={{ fontSize: 11, color: '#999' }}>
                                    Suporta arquivos .csv simples
                                </span>
                            </label>
                            <input
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const text = event.target?.result as string;
                                            setCsvInput(text);
                                            parseCSV(text);
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                            />
                        </div>
                        {csvInput && !recommendedType && (
                            <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14 }}>✅</span>
                                <span style={{ fontSize: 12, color: '#047857', fontWeight: 500 }}>CSV Carregado com sucesso</span>
                            </div>
                        )}
                        {recommendedType && (
                            <div style={{ marginTop: 10, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6 }}>
                                <p style={{ fontSize: 12, color: '#0369a1', margin: '0 0 6px 0', fontWeight: 600 }}>
                                    💡 Recomendação: {recommendedType === 'bar' ? 'Barras' : recommendedType === 'line' ? 'Linha' : recommendedType === 'pie' ? 'Pizza' : recommendedType}
                                </p>
                                <p style={{ fontSize: 11, color: '#0c4a6e', margin: 0, lineHeight: 1.4 }}>
                                    {recommendationReason}
                                </p>
                                <button
                                    onClick={() => handleTypeChange(recommendedType)}
                                    style={{ marginTop: 8, fontSize: 11, padding: '6px 10px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Aplicar Sugestão
                                </button>
                            </div>
                        )}
                    </>
                )}

                <button
                    onClick={() => setDataModalOpen(true)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        marginTop: 10,
                        background: 'white',
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#333',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#999'; e.currentTarget.style.background = '#fcfcfc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.background = 'white'; }}
                >
                    <span>Editor Avançado</span>
                    <span style={{ fontSize: 14 }}>↗</span>
                </button>
            </div>

            {/* SEÇÃO 2: TIPO E CONFIGURAÇÃO */}
            <div style={boxStyle}>
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Nome do Gráfico</label>
                    <input
                        type="text"
                        value={chartName}
                        onChange={(e) => setChartName(e.target.value)}
                        placeholder="Ex: Evolução de Vendas"
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={labelStyle}>Tipo de Visualização</label>
                        <button
                            type="button"
                            onClick={() => {
                                const mock = getMockDataForType(chartType);
                                setDataInput(JSON.stringify(mock, null, 2));
                                toast.success("Dados de exemplo carregados!");
                            }}
                            style={{
                                fontSize: 11,
                                padding: '4px 8px',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                borderRadius: 4,
                                cursor: 'pointer',
                                color: '#475569'
                            }}
                        >
                            Carregar Exemplo
                        </button>
                    </div>
                    <select
                        value={chartType}
                        onChange={(e) => handleTypeChange(e.target.value as ChartType)}
                        style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, background: 'white' }}
                    >
                        <option value="bar">Gráfico de Barras</option>
                        <option value="column">Gráfico de Colunas</option>
                        <option value="line">Gráfico de Linha</option>
                        <option value="area">Gráfico de Área</option>
                        <option value="pie">Gráfico de Pizza</option>
                        <option value="donut">Gráfico Donut</option>
                        <option value="scatter">Gráfico de Dispersão</option>
                        <option value="bubble">Gráfico de Bolhas</option>
                        <option value="radar">Gráfico Radar</option>
                        <option value="mixed">Gráfico Misto</option>
                        <option value="histogram">Histograma</option>
                        <option value="pictogram">📊 Pictograma (Ícones)</option>
                        <option value="gauge">🎯 Gráfico de Metas (Gauge)</option>
                        <option value="boxplot">Boxplot</option>
                    </select>
                </div>

            </div>

            {/* SEÇÃO 3: PECAS OPCIONAIS (ÍCONES) */}
            {
                chartType === 'pictogram' && (
                    <div style={boxStyle}>
                        <label style={labelStyle}>Ícone do Pictograma</label>
                        <button
                            type="button"
                            onClick={() => setIconModalOpen(true)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: 6,
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: '#333'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {selectedIcon && (
                                    <div style={{ width: 24, height: 24, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {/* Small preview if we had the component here, but text is fine */}
                                        <span style={{ fontSize: 14 }}>★</span>
                                    </div>
                                )}
                                <span>{selectedIcon ? selectedIcon.iconKey : 'Selecionar ícone...'}</span>
                            </div>
                            <span style={{ fontSize: 14, color: '#666' }}>Alterar</span>
                        </button>
                    </div>
                )
            }

            {/* SEÇÃO 4: CORES */}
            <div style={boxStyle}>
                <label style={labelStyle}>Cores e Tema</label>

                <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#666', marginBottom: 6, display: 'block' }}>Preset Rápido</span>
                    <select
                        value={colorPreset}
                        onChange={(e) => {
                            const preset = e.target.value as ColorPresetKey;
                            setColorPreset(preset);
                            setPalette(COLOR_PRESETS[preset].colors);
                        }}
                        style={{ width: '100%', padding: '8px', fontSize: 13, borderRadius: 6, border: '1px solid #ddd', background: 'white' }}
                    >
                        {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                            <option key={key} value={key}>{preset.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#666' }}>Paleta Atual</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={generatePalette} style={{ fontSize: 11, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Gerar Tons</button>
                            <button onClick={addColor} style={{ fontSize: 12, width: 20, height: 20, background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {palette.map((color, index) => (
                            <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', border: '1px solid #ddd', flexShrink: 0 }}>
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => updateColor(index, e.target.value)}
                                        style={{ width: '150%', height: '150%', transform: 'translate(-25%, -25%)', cursor: 'pointer', border: 'none', padding: 0 }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => updateColor(index, e.target.value)}
                                    style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                                />
                                {palette.length > 1 && (
                                    <button
                                        onClick={() => removeColor(index)}
                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: 0 }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Tipografia</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        style={{ width: '100%', padding: '8px', fontSize: 13, borderRadius: 6, border: '1px solid #ddd', background: 'white' }}
                    >
                        <option value="sans-serif">Sem Serifa (Sans Serif)</option>
                        <option value="serif">Com Serifa (Serif)</option>
                        <option value="monospace">Monoespaçada (Monospace)</option>
                    </select>
                </div>

                {/* Infographic Mode Toggle */}
                <div style={{ marginTop: 16 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8f9fa',
                        borderRadius: 8,
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{ fontSize: 13, color: '#444' }}>Infográfico?</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: chartMode === 'classic' ? '#666' : '#bbb' }}>Clássico</span>
                            <button
                                onClick={() => setChartMode(chartMode === 'classic' ? 'infographic' : 'classic')}
                                style={{
                                    position: 'relative',
                                    width: 44,
                                    height: 24,
                                    background: chartMode === 'infographic' ? '#0ea5e9' : '#cbd5e1',
                                    border: 'none',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    padding: 0
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 2,
                                    left: chartMode === 'infographic' ? 22 : 2,
                                    width: 20,
                                    height: 20,
                                    background: 'white',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }} />
                            </button>
                            <span style={{ fontSize: 11, color: chartMode === 'infographic' ? '#0ea5e9' : '#bbb', fontWeight: chartMode === 'infographic' ? 600 : 400 }}>Sim</span>
                        </div>
                    </div>
                </div>



                {/* Infographic Controls Button (Phase 2) */}
                {chartMode === 'infographic' && (
                    <div style={{ marginTop: 10 }}>
                        <button
                            onClick={() => setInfographicControlsOpen(true)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #bae6fd',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#0369a1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>⚙️ Controles Infográficos</span>
                            <span style={{ fontSize: 14 }}>→</span>
                        </button>
                    </div>
                )}

                {/* Gradient Effect Toggle */}
                <div style={{ marginTop: 10 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8f9fa',
                        borderRadius: 8,
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{ fontSize: 13, color: '#444' }}>Efeito Gradiente?</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: !useGradient ? '#666' : '#bbb' }}>Não</span>
                            <button
                                onClick={() => {
                                    const newValue = !useGradient;
                                    setUseGradient(newValue);
                                    if (newValue && finish === 'glass') {
                                        setFinish('standard');
                                    }
                                }}
                                style={{
                                    position: 'relative',
                                    width: 44,
                                    height: 24,
                                    background: useGradient ? '#8b5cf6' : '#cbd5e1',
                                    border: 'none',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    padding: 0
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 2,
                                    left: useGradient ? 22 : 2,
                                    width: 20,
                                    height: 20,
                                    background: 'white',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }} />
                            </button>
                            <span style={{ fontSize: 11, color: useGradient ? '#8b5cf6' : '#bbb', fontWeight: useGradient ? 600 : 400 }}>Sim</span>
                        </div>
                    </div>
                </div>

                {/* Glass Finish Toggle */}
                <div style={{ marginTop: 10 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8f9fa',
                        borderRadius: 8,
                        border: '1px solid #e9ecef'
                    }}>
                        <span style={{ fontSize: 13, color: '#444' }}>Acabamento Cristal? (Glass)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: finish !== 'glass' ? '#666' : '#bbb' }}>Padrão</span>
                            <button
                                onClick={() => {
                                    const newFinish = finish === 'glass' ? 'standard' : 'glass';
                                    setFinish(newFinish);
                                    if (newFinish === 'glass' && useGradient) {
                                        setUseGradient(false);
                                    }
                                }}
                                style={{
                                    position: 'relative',
                                    width: 44,
                                    height: 24,
                                    background: finish === 'glass' ? '#0ea5e9' : '#cbd5e1', // Cyan for Glass
                                    border: 'none',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    padding: 0
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 2,
                                    left: finish === 'glass' ? 22 : 2,
                                    width: 20,
                                    height: 20,
                                    background: 'white',
                                    borderRadius: '50%',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }} />
                            </button>
                            <span style={{ fontSize: 11, color: finish === 'glass' ? '#0ea5e9' : '#bbb', fontWeight: finish === 'glass' ? 600 : 400 }}>Vidro</span>
                        </div>
                    </div>
                </div>

                {/* Save Buttons */}
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                        onClick={saveProjectDefaults}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'none',
                            border: '1px dashed #0ea5e9',
                            borderRadius: 6,
                            color: '#0ea5e9',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Salvar no Projeto
                    </button>
                    <button
                        onClick={saveUserDefaultPreferences}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'none',
                            border: '1px dashed #8b5cf6',
                            borderRadius: 6,
                            color: '#8b5cf6',
                            fontSize: 12,
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Salvar Minhas Preferências
                    </button>
                </div>
            </div>

            {/* AÇÕES FINAIS */}
            <div style={{ paddingBottom: 20 }}>
                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={handleDelete}
                                style={{ flex: 1, padding: '12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                            >
                                Excluir
                            </button>
                            <button
                                onClick={handleUpdate}
                                style={{ flex: 2, padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                            >
                                Salvar Alterações
                            </button>
                        </div>

                        {/* Direct Export Action in Sidebar */}
                        <div style={{ marginTop: 10, borderTop: '1px solid #e5e5e5', paddingTop: 20 }}>
                            <label style={labelStyle}>Ações do Gráfico</label>
                            <button
                                onClick={() => exportChartToPng(editingChartId, { removeWhitespace: true })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    color: '#334155',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <span style={{ fontSize: 18 }}>🖼️</span>
                                Exportar este Gráfico (PNG)
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleCreate}
                        style={{ width: '100%', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    >
                        Criar Gráfico
                    </button>
                )}
            </div>

            {/* Modals outside the layout boxes */}
            <IconSelectorModal
                isOpen={iconModalOpen}
                onClose={() => setIconModalOpen(false)}
                onSelectIcon={(category, iconKey) => {
                    setSelectedIcon({ category, iconKey });
                }}
                currentIcon={selectedIcon || undefined}
            />

            <DataEditorModal
                isOpen={dataModalOpen}
                onClose={() => setDataModalOpen(false)}
                initialData={JSON.parse(dataInput || '{"labels":[],"datasets":[]}')}
                onSave={(newData, newDatasetTypes) => {
                    setDataInput(JSON.stringify(newData, null, 2));
                    if (newDatasetTypes) {
                        setInfographicConfig(prev => ({ ...prev, datasetTypes: newDatasetTypes }));
                    }
                }}
                chartType={chartType}
                datasetTypes={infographicConfig.datasetTypes}
            />

            <InfographicControlsModal
                isOpen={infographicControlsOpen}
                onClose={() => setInfographicControlsOpen(false)}
                chartData={JSON.parse(dataInput || '{"labels":[],"datasets":[]}')}
                chartType={chartType}
                currentConfig={{ ...infographicConfig, numberFormat }}
                onSave={(fullConfig) => {
                    const { numberFormat: newFmt, ...rest } = fullConfig;
                    setInfographicConfig(rest);
                    if (newFmt) setNumberFormat(newFmt);
                }}
            />
        </div >
    );
}
