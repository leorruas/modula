'use client';

import { useRef, useState, useEffect } from 'react';
import { Project, Chart } from '@/types';
import { useEditorStore } from '@/store/editorStore';
import { chartService } from '@/services/chartService';
import { projectService } from '@/services/projectService';
import { BarChart } from '@/features/charts/components/BarChart';
import { ColumnChart } from '@/features/charts/components/ColumnChart';
import { LineChart } from '@/features/charts/components/LineChart';
import { PieChart } from '@/features/charts/components/PieChart';
import { ScatterChart } from '@/features/charts/components/ScatterChart';
import { AreaChart } from '@/features/charts/components/AreaChart';
import { DonutChart } from '@/features/charts/components/DonutChart';
import { BubbleChart } from '@/features/charts/components/BubbleChart';
import { RadarChart } from '@/features/charts/components/RadarChart';
import { HistogramChart } from '@/features/charts/components/HistogramChart';
import { MixedChart } from '@/features/charts/components/MixedChart';
import { BoxplotChart } from '@/features/charts/components/BoxplotChart';
import { PictogramChart } from '@/features/charts/components/PictogramChart';
import { GenericChart } from '@/features/charts/components/GenericChart';


import { ValidationService, ValidationResult } from '@/services/validationService';
import { PDFExportService } from '@/services/pdfExportService';
import { Plus, Trash2, Minus } from 'lucide-react';


import { toast } from 'sonner';

interface CanvasProps {
    project: Project;
}

export function Canvas({ project }: CanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [charts, setCharts] = useState<Chart[]>([]);

    // Interaction States
    const [interactionMode, setInteractionMode] = useState<'none' | 'moving' | 'resizing'>('none');
    const [interactingChartId, setInteractingChartId] = useState<string | null>(null);
    const [interactionStart, setInteractionStart] = useState<{ x: number, y: number, initialModule: { x: number, y: number, w: number, h: number } } | null>(null);
    const [tempModule, setTempModule] = useState<{ x: number, y: number, w: number, h: number } | null>(null); // For real-time visual feedback

    const {
        refreshTrigger,
        isPreviewMode, // Replaced editorMode
        activePage,
        setActivePage,
        setEditingChartId,
        editingChartId,
        selectedModules,
        startSelection,
        isSelecting,
        setStartSelection,
        setIsSelecting,
        setSelection,
        triggerRefresh
    } = useEditorStore();
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

    // A4 dimensions in mm (standard reference)
    // We'll use 1mm = 3.7795px (96 DPI) approx
    const PIXELS_PER_MM = 3.78;
    const isLandscape = project.gridConfig.orientation === 'landscape';

    // Determine Base Dimensions based on Format (assuming A4 default if unknown)
    const formatBaseW = project.gridConfig.pageFormat === 'A3' ? 297 : (project.gridConfig.pageFormat === 'A5' ? 148 : 210);
    const formatBaseH = project.gridConfig.pageFormat === 'A3' ? 420 : (project.gridConfig.pageFormat === 'A5' ? 210 : 297);

    // Swap if Landscape
    const PAGE_WIDTH_MM = isLandscape ? Math.max(formatBaseW, formatBaseH) : Math.min(formatBaseW, formatBaseH);
    const PAGE_HEIGHT_MM = isLandscape ? Math.min(formatBaseW, formatBaseH) : Math.max(formatBaseW, formatBaseH);

    const widthPx = PAGE_WIDTH_MM * PIXELS_PER_MM;
    const heightPx = PAGE_HEIGHT_MM * PIXELS_PER_MM;

    // Grid calculations for chart placement
    const { columns: cfgColumns, rows: cfgRows, margin, gutter, mode, fixedModuleWidth, fixedModuleHeight } = project.gridConfig;
    const marginPx = margin * PIXELS_PER_MM;
    const gutterPx = gutter * PIXELS_PER_MM;

    let moduleWidth: number;
    let moduleHeight: number;
    let columns: number;
    let rows: number;

    if (mode === 'fixed' && fixedModuleWidth && fixedModuleHeight) {
        // Fixed: calculate grid based on module size
        // IMPORTANT: fixedModuleWidth is in mm
        moduleWidth = fixedModuleWidth * PIXELS_PER_MM;
        moduleHeight = fixedModuleHeight * PIXELS_PER_MM;

        const availW = widthPx - (2 * marginPx);
        const availH = heightPx - (2 * marginPx);
        columns = Math.max(1, Math.floor((availW + gutterPx) / (moduleWidth + gutterPx)));
        rows = Math.max(1, Math.floor((availH + gutterPx) / (moduleHeight + gutterPx)));
    } else {
        // Flexible: use saved cols/rows, calculate module size
        columns = cfgColumns;
        rows = cfgRows;
        const availableWidth = widthPx - (2 * marginPx) - ((columns - 1) * gutterPx);
        moduleWidth = availableWidth / columns;
        const availableHeight = heightPx - (2 * marginPx) - ((rows - 1) * gutterPx);
        moduleHeight = availableHeight / rows;
    }

    // ...

    useEffect(() => {
        const handleExport = async () => {
            if (containerRef.current) {
                // Find the wrapper div that contains the transform
                // It is the first child of containerRef
                const contentDiv = containerRef.current.children[0] as HTMLDivElement;
                if (contentDiv) {
                    await PDFExportService.exportProject(project, charts, contentDiv as any); // Type cast for simplicity
                }
            }
        };

        window.addEventListener('trigger-pdf-export', handleExport);
        return () => window.removeEventListener('trigger-pdf-export', handleExport);
    }, [project, charts]);

    useEffect(() => {
        const loadCharts = async () => {
            const data = await chartService.getProjectCharts(project.id);
            setCharts(data);

            // Run validations
            const results = ValidationService.validateProject(data, project.gridConfig);
            setValidationResults(results);
        };
        loadCharts();
    }, [project.id, refreshTrigger, project.gridConfig]);

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.1, scale + delta), 5);
            setScale(newScale);
        } else {
            setPosition(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    // Spacebar Panning Logic
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault(); // Prevent scroll
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Enforce Single Chart Per Page Rule
        const hasChart = charts.some(c => (c.page || 1) === activePage);

        // Pan Condition: Middle click OR Shift OR Spacebar
        if (e.button === 1 || e.shiftKey || e.buttons === 4 || isSpacePressed) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
            e.preventDefault();
            return;
        }

        if (isPreviewMode) return;

        // If chart exists, don't allow new selection
        if (hasChart && !editingChartId) {
            return;
        }

        // Only start selection if clicking on background (not on a chart)
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        // ... selection logic remains ...
        // Need to ensure we call original logic if passing checks
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (interactionMode !== 'none' && interactionStart && interactingChartId) {
            e.preventDefault();
            const currentX = e.clientX;
            const currentY = e.clientY;

            // Calculate delta in pixels
            // We need to account for scale!!!
            const deltaX = (currentX - interactionStart.x) / scale;
            const deltaY = (currentY - interactionStart.y) / scale;

            // Convert pixels to Grid Modules
            // 1 module step = moduleWidth + gutterPx
            const stepX = moduleWidth + gutterPx;
            const stepY = moduleHeight + gutterPx;

            const deltaCols = Math.round(deltaX / stepX);
            const deltaRows = Math.round(deltaY / stepY);

            const initial = interactionStart.initialModule;

            if (interactionMode === 'moving') {
                // Update X, Y
                let newX = initial.x + deltaCols;
                let newY = initial.y + deltaRows;

                // Boundaries
                newX = Math.max(0, Math.min(newX, columns - initial.w));
                newY = Math.max(0, Math.min(newY, rows - initial.h));

                setTempModule({ ...initial, x: newX, y: newY });
            } else if (interactionMode === 'resizing') {
                // Update W, H
                let newW = initial.w + deltaCols;
                let newH = initial.h + deltaRows;

                // Min size 1x1
                newW = Math.max(1, Math.min(newW, columns - initial.x));
                newH = Math.max(1, Math.min(newH, rows - initial.y));

                setTempModule({ ...initial, w: newW, h: newH });
            }
            return;
        }

        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = async () => {
        if (interactionMode !== 'none' && interactingChartId && tempModule) {
            // Commit Change
            const chart = charts.find(c => c.id === interactingChartId);
            if (chart) {
                // Check if changed
                if (chart.module.x !== tempModule.x || chart.module.y !== tempModule.y || chart.module.w !== tempModule.w || chart.module.h !== tempModule.h) {
                    // Optimistic update
                    setCharts(prev => prev.map(c => c.id === interactingChartId ? { ...c, module: tempModule } : c));

                    await chartService.updateChart(chart.id, { module: tempModule });
                    toast.success(interactionMode === 'moving' ? "Gráfico movido" : "Gráfico redimensionado");
                }
            }
            setInteractionMode('none');
            setInteractingChartId(null);
            setInteractionStart(null);
            setTempModule(null);
            return;
        }

        setIsDragging(false);
    };

    // Center canvas initially
    useEffect(() => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setPosition({
                x: (clientWidth - widthPx) / 2,
                y: (clientHeight - heightPx) / 2
            });
        }
    }, [widthPx, heightPx]);

    // ...
    // ...
    const [totalPages, setTotalPages] = useState(project.totalPages || 1);

    // ...

    useEffect(() => {
        setTotalPages(project.totalPages || 1);
    }, [project.totalPages]);

    const handleAddPage = async () => {
        const newTotal = totalPages + 1;
        setTotalPages(newTotal);
        await projectService.updateProject(project.id, { totalPages: newTotal });
        setActivePage(newTotal);
    };

    const handleDeletePage = async () => {
        if (totalPages <= 1) {
            toast.error("O projeto deve ter pelo menos uma página.");
            return;
        }

        // Check if there are charts
        const hasCharts = charts.some(c => (c.page || 1) === activePage);
        if (hasCharts) {
            if (!confirm(`Tem certeza? Esta página contém gráficos que serão excluídos permanentemente.`)) {
                return;
            }
        } else {
            // Optional: still confirm or just delete if empty? 
            // Let's stick to safer UX: confirm always or just if unsafe. 
            // If empty, maybe just delete. Let's ask confirm to be safe mainly against accidental clicks.
            if (!confirm("Excluir esta página?")) return;
        }

        try {
            await projectService.deletePage(project.id, activePage, totalPages);
            toast.success("Página excluída.");
            setTotalPages(prev => prev - 1);
            if (activePage > 1) {
                setActivePage(activePage - 1);
            } else {
                // If we deleted page 1, we stay at page 1 (which is now the old page 2)
                // We need to trigger chart refresh because chartService shifts happen in backend
                // The useEffect loadCharts will run but we might need to force refresh if not automatic.
                // Our loadCharts depends on `refreshTrigger` or `project.id`.
                // Let's force refresh.
            }
            triggerRefresh();
        } catch (e) {
            console.error(e);
            toast.error("Erro ao excluir página.");
        }
    };

    // Filter charts for active page
    // Handle legacy charts (undefined page) as page 1
    const activeCharts = charts.filter(c => (c.page || 1) === activePage);

    return (
        <div
            // ... container styling
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : (isSpacePressed ? 'grab' : 'default'),
                touchAction: 'none',
                background: '#e0e0e0' // Darker background to see page boundaries
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    width: widthPx,
                    height: heightPx,
                    backgroundColor: 'white',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                    position: 'absolute'
                }}
            >
                {/* Grid Layer - Hidden in Preview Mode */}
                {!isPreviewMode && <GridSystem project={project} width={widthPx} height={heightPx} activeCharts={activeCharts} />}

                {/* Content Layer (Charts) */}
                {/* Content Layer (Charts) */}
                {activeCharts.map(chart => {
                    const isInteracting = interactingChartId === chart.id;
                    const module = isInteracting && tempModule ? tempModule : chart.module;

                    const x = marginPx + module.x * (moduleWidth + gutterPx);
                    const y = marginPx + module.y * (moduleHeight + gutterPx);
                    const w = module.w * moduleWidth + (module.w - 1) * gutterPx;
                    const h = module.h * moduleHeight + (module.h - 1) * gutterPx;

                    // DEBUG: Log chart sizing
                    if (chart.id === charts[0]?.id) {
                        console.log('🔍 Chart Debug:', {
                            moduleWH: `${module.w}x${module.h}`,
                            modulePos: `(${module.x},${module.y})`,
                            moduleWidth, moduleHeight,
                            gutterPx,
                            calculatedW: w,
                            calculatedH: h
                        });
                    }


                    const validation = validationResults.find(v => v.chartId === chart.id);
                    const isSelected = editingChartId === chart.id;

                    return (
                        <div
                            key={chart.id}
                            id={`chart-container-${chart.id}`}
                            style={{
                                position: 'absolute',
                                left: x, top: y, width: w, height: h,
                                pointerEvents: 'auto',
                                cursor: isPreviewMode ? 'default' : 'move', // Cursor indicate draggable
                                zIndex: isInteracting ? 100 : (isSelected ? 50 : 10),
                                transition: isInteracting ? 'none' : 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
                            }}
                            onMouseDown={(e) => {
                                if (isPreviewMode) return;

                                // Only handle left click for selection/moving
                                if (e.button !== 0) return;

                                e.stopPropagation();
                                setEditingChartId(chart.id);
                                // Start Moving
                                setInteractionMode('moving');
                                setInteractingChartId(chart.id);
                                setInteractionStart({ x: e.clientX, y: e.clientY, initialModule: chart.module });
                                setTempModule(chart.module);
                            }}
                        >
                            {/* Render Chart Component ... */}
                            {/* Pass pointer-events: none to inner charts so they don't block mouse events on parent div, actually we want clicks. 
                                But for Drag, parent catches it. 
                            */}
                            <div
                                key={`${chart.id}-${chart.style?.mode || 'classic'}-${chart.style?.colorPalette?.join(',') || 'default'}`}
                                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                            >
                                {chart.type === 'bar' && <BarChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'column' && <ColumnChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'line' && <LineChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'pie' && <PieChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'donut' && <DonutChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'scatter' && <ScatterChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'bubble' && <BubbleChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'radar' && <RadarChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'histogram' && <HistogramChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'mixed' && <MixedChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'boxplot' && <BoxplotChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'pictogram' && <PictogramChart width={w} height={h} data={chart.data} style={chart.style} />}
                                {chart.type === 'area' && <AreaChart width={w} height={h} data={chart.data} style={chart.style} />}
                            </div>

                            {/* Selection Outline when Editing */}
                            {isSelected && (
                                <div className="selection-outline" style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    border: '2px solid #3b82f6',
                                    pointerEvents: 'none'
                                }} />
                            )}

                            {/* Resize Handle */}
                            {isSelected && !isPreviewMode && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: -6,
                                        right: -6,
                                        width: 12,
                                        height: 12,
                                        background: 'white',
                                        border: '2px solid #3b82f6',
                                        borderRadius: '50%',
                                        cursor: 'se-resize',
                                        pointerEvents: 'auto',
                                        zIndex: 101
                                    }}
                                    onMouseDown={(e) => {
                                        // Only handle left click for resizing
                                        if (e.button !== 0) return;

                                        e.stopPropagation();
                                        // Start Resizing
                                        setInteractionMode('resizing');
                                        setInteractingChartId(chart.id);
                                        setInteractionStart({ x: e.clientX, y: e.clientY, initialModule: chart.module });
                                        setTempModule(chart.module);
                                    }}
                                />
                            )}

                            {/* Validation Overlay per Chart - Option: Show in edit mode or specific validation mode? 
                                For now, hide in clean preview 
                            */}
                            {!isPreviewMode && validation && (
                                <div style={{
                                    position: 'absolute',
                                    top: -10,
                                    right: -10,
                                    background: validation.level === 'error' ? '#ef4444' : '#f59e0b',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    zIndex: 100,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}>
                                    <span>!</span> {validation.message}
                                </div>
                            )}
                        </div>
                    );
                })}


            </div>

            {/* Pagination Controls */}
            <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                background: 'white', padding: '8px 16px', borderRadius: 30,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 15
            }}>
                <button
                    disabled={activePage === 1}
                    onClick={() => setActivePage(activePage - 1)}
                    style={{ border: 'none', background: 'transparent', cursor: activePage === 1 ? 'not-allowed' : 'pointer', opacity: activePage === 1 ? 0.3 : 1, color: '#000', fontSize: 16 }}
                >
                    ◄
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#000' }}>
                        Página {activePage} de {totalPages}
                    </span>
                    {project.chapters && (
                        <span style={{ fontSize: 11, color: '#444', marginTop: 2 }}>
                            {project.chapters.slice().reverse().find(c => c.startPage <= activePage)?.title || 'Sem Capítulo'}
                        </span>
                    )}
                </div>

                <button
                    disabled={activePage === totalPages}
                    onClick={() => setActivePage(activePage + 1)}
                    style={{ border: 'none', background: 'transparent', cursor: activePage === totalPages ? 'not-allowed' : 'pointer', opacity: activePage === totalPages ? 0.3 : 1, color: '#000', fontSize: 16 }}
                >
                    ►
                </button>
                <div style={{ width: 1, height: 20, background: '#eee' }} />

                {/* Add Page (Continue Chapter) */}
                <button
                    onClick={async () => {
                        const newTotal = totalPages + 1;
                        setTotalPages(newTotal);
                        await projectService.updateProject(project.id, { totalPages: newTotal });
                        setActivePage(newTotal);
                    }}
                    title="Adicionar página ao capítulo atual"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#666', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                    <Plus size={14} /> Pág
                </button>

                <div style={{ width: 1, height: 20, background: '#eee', margin: '0 4px' }} />

                <button
                    onClick={handleDeletePage}
                    title="Excluir página atual"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                >
                    <Trash2 size={14} />
                </button>

                {/* Add New Chapter */}
                <button
                    onClick={async () => {
                        const chapterName = prompt("Nome do Novo Capítulo:");
                        if (!chapterName) return;

                        const newTotal = totalPages + 1;
                        const newChapters = [...(project.chapters || []), { title: chapterName, startPage: newTotal }];

                        setTotalPages(newTotal);
                        await projectService.updateProject(project.id, {
                            totalPages: newTotal,
                            chapters: newChapters
                        });
                        setActivePage(newTotal);
                    }}
                    title="Começar novo capítulo"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#000' }}
                >
                    + Cap
                </button>
            </div>

            {/* Scale Controls */}
            <div style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                background: 'white',
                padding: '4px 6px',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid #e5e5e5',
                zIndex: 50
            }}>
                <button
                    onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
                    style={{
                        padding: 6,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <Minus size={16} />
                </button>

                <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    minWidth: 44,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {Math.round(scale * 100)}%
                </span>

                <button
                    onClick={() => setScale(s => Math.min(5, s + 0.1))}
                    style={{
                        padding: 6,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* ... Validation Summary ... */}
            {
                !isPreviewMode && validationResults.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 20,
                        right: 20,
                        background: 'white',
                        padding: 15,
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxWidth: 300
                    }}>
                        <h3 style={{ fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#ef4444' }}>●</span>
                            Validation Issues ({validationResults.length})
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {validationResults.map((res, i) => (
                                <li key={i} style={{ fontSize: 11, marginBottom: 6, color: '#666', borderBottom: '1px solid #f0f0f0', paddingBottom: 4 }}>
                                    {res.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }
        </div >
    );
}

function GridSystem({ project, width, height, activeCharts }: { project: Project; width: number; height: number; activeCharts: Chart[] }) {
    const { columns, rows, margin, gutter } = project.gridConfig;
    const PIXELS_PER_MM = 3.78;

    const marginPx = margin * PIXELS_PER_MM;
    const gutterPx = gutter * PIXELS_PER_MM;

    // Calculate module size
    let moduleWidth: number;
    let moduleHeight: number;

    if (project.gridConfig.mode === 'fixed' && project.gridConfig.fixedModuleWidth && project.gridConfig.fixedModuleHeight) {
        moduleWidth = project.gridConfig.fixedModuleWidth * PIXELS_PER_MM;
        moduleHeight = project.gridConfig.fixedModuleHeight * PIXELS_PER_MM;
    } else {
        const availableWidth = width - (2 * marginPx) - ((columns - 1) * gutterPx);
        moduleWidth = availableWidth / columns;

        const availableHeight = height - (2 * marginPx) - ((rows - 1) * gutterPx);
        moduleHeight = availableHeight / rows;
    }

    const { selectedModules, startSelection, isSelecting, setStartSelection, setIsSelecting, setSelection, isPreviewMode, editingChartId } = useEditorStore();

    const selectionRef = useRef(selectedModules);
    selectionRef.current = selectedModules;

    const potentialDeselectRef = useRef<{ r: number, c: number } | null>(null);

    const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
        if (isPreviewMode) return; // Locked in preview

        // Enforce Single Chart Per Page
        if (activeCharts.length > 0 && !editingChartId) {
            return;
        }

        e.stopPropagation();

        // Check for potential deselect (if clicking the single currently selected module)
        if (selectionRef.current.length === 1 &&
            selectionRef.current[0].r === r &&
            selectionRef.current[0].c === c) {
            potentialDeselectRef.current = { r, c };
        } else {
            potentialDeselectRef.current = null;
        }

        setStartSelection({ r, c });
        setIsSelecting(true);
        setSelection([{ r, c }]);
    };

    const handleMouseEnter = (r: number, c: number) => {
        if (isPreviewMode) return; // Locked
        if (isSelecting && startSelection) {
            const minR = Math.min(startSelection.r, r);
            const maxR = Math.max(startSelection.r, r);
            const minC = Math.min(startSelection.c, c);
            const maxC = Math.max(startSelection.c, c);

            const newSelection = [];
            for (let i = minR; i <= maxR; i++) {
                for (let j = minC; j <= maxC; j++) {
                    newSelection.push({ r: i, c: j });
                }
            }
            setSelection(newSelection);
        }
    };

    const handleMouseUp = () => {
        if (isPreviewMode) return;

        // Logic to finalize deselect if we didn't drag
        if (potentialDeselectRef.current) {
            const current = selectionRef.current;
            // If selection is still just 1 item and matches the target, it means no drag expanded it
            if (current.length === 1 &&
                current[0].r === potentialDeselectRef.current.r &&
                current[0].c === potentialDeselectRef.current.c) {
                setSelection([]);
            }
            potentialDeselectRef.current = null;
        }

        setIsSelecting(false);
        setStartSelection(null);
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const isSelected = (r: number, c: number) => {
        return selectedModules.some(m => m.r === r && m.c === c);
    };

    return (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Margins */}
            <rect x={0} y={0} width={width} height={height} fill="none" stroke="rgba(255,0,0,0.1)" strokeWidth="1" pointerEvents="none" />
            <rect x={marginPx} y={marginPx} width={width - 2 * marginPx} height={height - 2 * marginPx} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" pointerEvents="none" />

            <g>
                {Array.from({ length: rows }).map((_, r) =>
                    Array.from({ length: columns }).map((_, c) => (
                        <rect
                            key={`${r}-${c}`}
                            x={marginPx + c * (moduleWidth + gutterPx)}
                            y={marginPx + r * (moduleHeight + gutterPx)}
                            width={moduleWidth}
                            height={moduleHeight}
                            fill={isSelected(r, c) ? "rgba(0, 0, 255, 0.2)" : "rgba(0,0,0,0.03)"}
                            stroke={isSelected(r, c) ? "rgba(0, 0, 255, 0.5)" : "rgba(0,0,0,0.05)"}
                            onMouseDown={(e) => handleMouseDown(r, c, e as any)}
                            onMouseEnter={() => handleMouseEnter(r, c)}
                            style={{ cursor: isPreviewMode ? 'default' : 'pointer', transition: 'fill 0.1s' }}
                        />
                    ))
                )}
            </g>
        </svg>
    );
}
