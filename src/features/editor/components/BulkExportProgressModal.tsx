import React from 'react';
import ReactDOM from 'react-dom';
import { Project, Chart, GridConfig } from '@/types';
import { Loader2 } from 'lucide-react';
import { OffScreenChartRenderer } from './OffScreenChartRenderer';

interface BulkExportProgressModalProps {
    isOpen: boolean;
    progress: number;
    currentAction: string;
    exportQueue: { chart: Chart, width: number, height: number }[];
    gridConfig: GridConfig;
    onChartReady?: (chartId: string) => void;
}

export function BulkExportProgressModal({ isOpen, progress, currentAction, exportQueue, gridConfig, onChartReady }: BulkExportProgressModalProps) {
    if (!isOpen) return null;

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <>
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 9999, // Super high z-index
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '30px 40px',
                    borderRadius: 12,
                    width: 400,
                    textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <h3 style={{ fontSize: 18, marginBottom: 8, color: '#111' }}>Exportando Gráficos</h3>
                    <p style={{ fontSize: 14, color: '#666', marginBottom: 24, minHeight: 40 }}>{currentAction}</p>

                    <div style={{ height: 6, width: '100%', background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: '#3b82f6', transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#888', marginTop: 8 }}>{progress}%</div>
                </div>

                {/* HEADLESS RENDER AREA - RENDER ALL CHARTS AT ONCE */}
                {/* We use opacity: 0 and fixed position to ensure the browser RENDERS them (no optimizations for off-screen) */}
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 100, /* Small area, but visible to layout engine */
                    height: 100,
                    opacity: 0.01, /* Not 0 to avoid "invisible" optimizations */
                    zIndex: -1000,
                    pointerEvents: 'none',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {exportQueue.map((item) => (
                            <div key={item.chart.id} style={{ position: 'relative', width: item.width, height: item.height, marginBottom: 20 }}>
                                <OffScreenChartRenderer
                                    id={`headless-chart-${item.chart.id}`}
                                    chart={item.chart}
                                    width={item.width}
                                    height={item.height}
                                    gridConfig={gridConfig}
                                    onReady={() => onChartReady?.(item.chart.id)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
