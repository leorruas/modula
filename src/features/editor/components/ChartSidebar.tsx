import { useState, useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { chartService } from '@/services/chartService';
import { projectService } from '@/services/projectService';
import { ChartType } from '@/types';
import { toast } from 'sonner';
import { SimpleDataEditor } from './SimpleDataEditor';
import { recommendChartType, getRecommendationReason } from '@/services/chartRecommendationService';
import { generateMonochromaticPalette } from '@/utils/colors';
import { COLOR_PRESETS, type ColorPresetKey } from '@/utils/chartTheme';
import { IconSelectorModal } from './IconSelectorModal';

interface ChartSidebarProps {
    projectId: string;
}

export function ChartSidebar({ projectId }: ChartSidebarProps) {
    const { selectedModules, triggerRefresh, setSelection, editorMode, editingChartId, setEditingChartId, activePage } = useEditorStore();
    const [chartType, setChartType] = useState<ChartType>('bar');
    // Default palette
    const [palette, setPalette] = useState<string[]>(['#000000', '#666666', '#cccccc']);
    const [projectColorsLoaded, setProjectColorsLoaded] = useState(false);
    const [fontFamily, setFontFamily] = useState('sans-serif');
    const [notes, setNotes] = useState('');
    const [chartName, setChartName] = useState('');
    const [chartStatus, setChartStatus] = useState<'draft' | 'ready' | 'published'>('draft');
    const [chartMode, setChartMode] = useState<'classic' | 'infographic'>('classic');
    const [colorPreset, setColorPreset] = useState<ColorPresetKey>('vibrantModern');

    const [inputMode, setInputMode] = useState<'simple' | 'csv' | 'json'>('simple');
    const [csvInput, setCsvInput] = useState('');
    const [recommendedType, setRecommendedType] = useState<ChartType | null>(null);
    const [recommendationReason, setRecommendationReason] = useState('');

    // Icon states
    const [iconModalOpen, setIconModalOpen] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState<{ category: string; iconKey: string } | null>(null);

    const [dataInput, setDataInput] = useState(JSON.stringify({
        labels: ["A", "B", "C", "D"],
        datasets: [{ label: "Dataset 1", data: [10, 20, 15, 25] }]
    }, null, 2));

    // Load project colors initially
    useEffect(() => {
        if (!projectColorsLoaded) {
            projectService.getProject(projectId).then(project => {
                if (project && project.colors && project.colors.length > 0) {
                    setPalette(project.colors);
                }
                setProjectColorsLoaded(true);
            });
        }
    }, [projectId, projectColorsLoaded]);

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
                    { label: "Volume (Eixo Esq)", data: [500, 700, 600, 800, 750, 900] },
                    { label: "Taxa % (Eixo Dir)", data: [20, 40, 30, 50, 45, 60] }
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
                    setDataInput(JSON.stringify(chart.data, null, 2));
                    setChartName(chart.name || '');
                    setChartStatus(chart.status || 'draft');
                    setInputMode('json');
                }
            });
        }
    }, [editingChartId, projectId]);

    const handleTypeChange = (newType: ChartType) => {
        setChartType(newType);
        // Don't auto-load mock data - user can click "Carregar Exemplo" button
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
        } catch (e) {
            console.error("CSV Parse Error", e);
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

        try {
            const parsedData = JSON.parse(dataInput);
            await chartService.createChart(projectId, {
                name: chartName || `Gráfico ${Date.now()}`,
                type: chartType,
                status: chartStatus,
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
                    mode: chartMode
                }
            });
            triggerRefresh();
            setSelection([]); // Clear selection after create
            toast.success("Gráfico criado com sucesso!");
        } catch (e) {
            alert("JSON de dados inválido");
        }
    };

    const handleUpdate = async () => {
        if (!editingChartId) return;
        try {
            const parsedData = JSON.parse(dataInput);
            await chartService.updateChart(editingChartId, {
                name: chartName || undefined,
                type: chartType,
                status: chartStatus,
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
                    mode: chartMode
                }
            });
            triggerRefresh();
            setEditingChartId(null); // Exit edit mode
            toast.success("Gráfico atualizado");
        } catch (e) {
            alert("Erro ao atualizar: JSON inválido");
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


    const saveProjectColors = async () => {
        if (palette.length === 0) return;
        try {
            // We need to update the project. Importing projectService inside the component
            // to avoid circular dependencies or just using the service directly if available.
            const { projectService } = await import('@/services/projectService');
            await projectService.updateProject(projectId, { colors: palette });
            toast.success("Cores salvas como padrão do projeto");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao salvar cores");
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

    if (editorMode === 'publication') {
        return (
            <div style={{
                position: 'absolute', right: 0, top: 60, bottom: 0, width: 300,
                background: '#f9f9f9', borderLeft: '1px solid #ddd', padding: 20,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#999'
            }}>
                <p>Modo Publicação</p>
                <p style={{ fontSize: 12 }}>Edição Bloqueada</p>
            </div>
        );
    }

    // If not editing and nothing selected, show instructions
    if (!isEditing && selectedModules.length === 0) {
        return (
            <div style={{
                position: 'absolute', right: 0, top: 60, bottom: 0, width: 300,
                background: '#f9f9f9', borderLeft: '1px solid #ddd', padding: 20,
                display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#999', textAlign: 'center', fontSize: 13
            }}>
                <p>Selecione uma área no grid para criar um gráfico ou clique em um gráfico existente para editar.</p>
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            right: 0,
            top: 60,
            bottom: 0,
            width: 300,
            background: 'white',
            borderLeft: '1px solid #ddd',
            padding: 20,
            boxShadow: '-2px 0 10px rgba(0,0,0,0.05)',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                {isEditing && (
                    <button onClick={() => setEditingChartId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>←</button>
                )}
                <h2 style={{ fontSize: 20, fontFamily: 'Georgia, serif', margin: 0, color: '#000' }}>
                    {isEditing ? 'Editar Gráfico' : 'Adicionar Gráfico'}
                </h2>
            </div>

            {!isEditing && (
                <p style={{ fontSize: 13, color: '#333', marginBottom: 20 }}>
                    Área Selecionada: <span style={{ fontWeight: 600 }}>{selectedModules.length} módulos</span>
                </p>
            )}

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#222' }}>Nome do Gráfico</label>
                <input
                    type="text"
                    value={chartName}
                    onChange={(e) => setChartName(e.target.value)}
                    placeholder="Ex: Evolução de Vendas"
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#222' }}>Status Editorial</label>
                <select
                    value={chartStatus}
                    onChange={(e) => setChartStatus(e.target.value as any)}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                    <option value="draft">🟡 Rascunho</option>
                    <option value="ready">🟢 Pronto</option>
                    <option value="published">🔵 Publicado</option>
                </select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#222' }}>Tipo</label>
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
                            background: '#f0f0f0',
                            border: '1px solid #ccc',
                            borderRadius: 3,
                            cursor: 'pointer',
                            color: '#333'
                        }}
                    >
                        💡 Carregar Exemplo
                    </button>
                </div>
                <select
                    value={chartType}
                    onChange={(e) => handleTypeChange(e.target.value as ChartType)}
                    style={{ width: '100%', padding: 8, marginTop: 5, borderRadius: 4, border: '1px solid #ddd' }}
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
                    <option value="boxplot">Boxplot</option>
                </select>
            </div>

            {/* Modo de Visualização - TOGGLE */}
            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Modo de Visualização
                </label>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6
                }}>
                    <span style={{
                        fontSize: 12,
                        fontWeight: chartMode === 'classic' ? 600 : 400,
                        color: chartMode === 'classic' ? '#222' : '#999'
                    }}>
                        📊 Clássico
                    </span>
                    <button
                        onClick={() => setChartMode(chartMode === 'classic' ? 'infographic' : 'classic')}
                        style={{
                            position: 'relative',
                            width: 44,
                            height: 24,
                            background: chartMode === 'infographic' ? '#00D9FF' : '#ccc',
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
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </button>
                    <span style={{
                        fontSize: 12,
                        fontWeight: chartMode === 'infographic' ? 600 : 400,
                        color: chartMode === 'infographic' ? '#222' : '#999'
                    }}>
                        🎨 Infográfico
                    </span>
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                    {chartMode === 'classic' ? 'Grid sutil, tipografia equilibrada' : 'Números gigantes, minimalista'}
                </div>
            </div>

            {/* Preset de Cores */}
            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#222' }}>
                    Preset de Cores
                </label>
                <select
                    value={colorPreset}
                    onChange={(e) => {
                        const preset = e.target.value as ColorPresetKey;
                        setColorPreset(preset);
                        setPalette(COLOR_PRESETS[preset].colors);
                    }}
                    style={{ width: '100%', padding: 8, fontSize: 13, borderRadius: 4, border: '1px solid #ccc' }}
                >
                    {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>{preset.name}</option>
                    ))}
                </select>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {COLOR_PRESETS[colorPreset].colors.slice(0, 5).map((color, i) => (
                        <div
                            key={i}
                            style={{
                                width: 24,
                                height: 24,
                                backgroundColor: color,
                                borderRadius: 3,
                                border: '1px solid #ddd'
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Icon Selector */}
            {(chartType === 'bar' || chartType === 'pictogram') && (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#222' }}>
                        Ícone (Opcional)
                    </label>
                    <button
                        type="button"
                        onClick={() => setIconModalOpen(true)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{selectedIcon ? `${selectedIcon.iconKey} (${selectedIcon.category})` : 'Selecionar ícone...'}</span>
                        <span style={{ fontSize: 18 }}>🎨</span>
                    </button>
                    {selectedIcon && (
                        <button
                            type="button"
                            onClick={() => setSelectedIcon(null)}
                            style={{
                                marginTop: 6,
                                fontSize: 11,
                                color: '#ef4444',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            ✕ Remover ícone
                        </button>
                    )}
                </div>
            )}

            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#222' }}>Paleta de Cores</label>
                    <div style={{ display: 'flex', gap: 5 }}>
                        <button
                            onClick={saveProjectColors}
                            style={{ background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                            title="Salvar como padrão do projeto"
                        >
                            Salvar no Projeto
                        </button>
                        <button
                            onClick={generatePalette}
                            style={{ background: 'none', border: 'none', color: '#666', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                            title="Gerar tons monocromáticos"
                        >
                            Gerar Tons
                        </button>
                        <button
                            onClick={addColor}
                            style={{ background: 'none', border: 'none', color: '#000', fontSize: 18, cursor: 'pointer', padding: 0 }}
                            title="Adicionar cor"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {palette.map((color, index) => (
                        <div key={index} style={{ display: 'flex', gap: 10 }}>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => updateColor(index, e.target.value)}
                                style={{ width: 40, height: 36, padding: 0, border: 'none', cursor: 'pointer' }}
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => updateColor(index, e.target.value)}
                                style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
                            />
                            {palette.length > 1 && (
                                <button
                                    onClick={() => removeColor(index)}
                                    style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#222' }}>Tipografia</label>
                <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                >
                    <option value="sans-serif">Sem Serifa (Sans Serif)</option>
                    <option value="serif">Com Serifa (Serif)</option>
                    <option value="monospace">Monoespaçada (Monospace)</option>
                </select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#222' }}>Dados</label>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span
                            onClick={() => setInputMode('simple')}
                            style={{ cursor: 'pointer', fontWeight: inputMode === 'simple' ? 'bold' : 'normal', textDecoration: inputMode === 'simple' ? 'underline' : 'none', color: inputMode === 'simple' ? '#000' : '#888' }}
                        >
                            Tabela
                        </span>
                        <span
                            onClick={() => setInputMode('csv')}
                            style={{ cursor: 'pointer', fontWeight: inputMode === 'csv' ? 'bold' : 'normal', textDecoration: inputMode === 'csv' ? 'underline' : 'none', color: inputMode === 'csv' ? '#000' : '#888' }}
                        >
                            CSV
                        </span>
                    </div>
                </div>

                {inputMode === 'simple' ? (
                    <SimpleDataEditor
                        data={JSON.parse(dataInput || '{"labels":[],"datasets":[]}')}
                        onChange={(newData) => setDataInput(JSON.stringify(newData, null, 2))}
                    />
                ) : inputMode === 'json' ? (
                    <textarea
                        value={dataInput}
                        onChange={(e) => setDataInput(e.target.value)}
                        style={{ width: '100%', height: 150, fontFamily: 'monospace', fontSize: 12, padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                    />
                ) : (
                    <>
                        <textarea
                            value={csvInput}
                            onChange={(e) => {
                                setCsvInput(e.target.value);
                                parseCSV(e.target.value);
                            }}
                            placeholder="Categoria, Valor 1, Valor 2&#10;A, 10, 20&#10;B, 30, 40"
                            style={{ width: '100%', height: 150, fontFamily: 'monospace', fontSize: 12, padding: 8, borderRadius: 4, border: '1px solid #ddd', marginBottom: 5 }}
                        />
                        <p style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
                            Formato: Primeira linha cabeçalho, linhas seguintes dados. Ex: Categoria, Série A, Série B
                        </p>
                        {recommendedType && (
                            <div style={{ marginTop: 10, padding: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 4 }}>
                                <p style={{ fontSize: 12, color: '#0369a1', margin: '0 0 5px 0', fontWeight: 600 }}>
                                    💡 Sugestão: {recommendedType === 'bar' ? 'Barras' : recommendedType === 'line' ? 'Linha' : recommendedType === 'pie' ? 'Pizza' : recommendedType}
                                </p>
                                <p style={{ fontSize: 11, color: '#0c4a6e', margin: 0 }}>
                                    {recommendationReason}
                                </p>
                                <button
                                    onClick={() => handleTypeChange(recommendedType)}
                                    style={{ marginTop: 8, fontSize: 11, padding: '4px 8px', background: '#0284c7', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                                >
                                    Aplicar Sugestão
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, fontWeight: 600, color: '#222' }}>Notas (Invisíveis)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas editoriais, contexto ou fontes..."
                    style={{ width: '100%', height: 80, fontFamily: 'inherit', fontSize: 12, padding: 8, borderRadius: 4, border: '1px solid #ddd' }}
                />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {isEditing ? (
                    <>
                        <button
                            onClick={handleDelete}
                            style={{ flex: 1, padding: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                        >
                            Excluir
                        </button>
                        <button
                            onClick={handleUpdate}
                            style={{ flex: 2, padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                        >
                            Salvar
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleCreate}
                        style={{ width: '100%', padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                    >
                        Criar Gráfico
                    </button>
                )}
            </div>

            {/* Icon Selector Modal */}
            <IconSelectorModal
                isOpen={iconModalOpen}
                onClose={() => setIconModalOpen(false)}
                onSelectIcon={(category, iconKey) => {
                    setSelectedIcon({ category, iconKey });
                }}
                currentIcon={selectedIcon || undefined}
            />
        </div>
    );
}
