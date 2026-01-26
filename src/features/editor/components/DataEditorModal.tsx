'use client';

import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChartData } from '@/types';
import { SimpleDataEditor } from './SimpleDataEditor';

interface DataEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ChartData;
    onSave: (data: ChartData, datasetTypes?: ('bar' | 'line')[]) => void;
    chartType?: string;
    datasetTypes?: ('bar' | 'line')[];
}

export function DataEditorModal({ isOpen, onClose, initialData, onSave, chartType, datasetTypes: initialDatasetTypes }: DataEditorModalProps) {
    const [data, setData] = useState<ChartData>(initialData);
    const [jsonMode, setJsonMode] = useState(false);
    const [datasetTypes, setDatasetTypes] = useState<('bar' | 'line')[] | undefined>(initialDatasetTypes);

    // Reset data when modal opens
    useEffect(() => {
        if (isOpen) {
            setData(initialData);
            setDatasetTypes(initialDatasetTypes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(data, datasetTypes);
        onClose();
    };

    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
            <div style={{
                background: 'white',
                width: 900,
                maxWidth: '95vw',
                height: '80vh',
                borderRadius: 12,
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'scaleIn 0.2s ease-out'
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fafafa'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <h2 style={{ fontSize: 20, fontFamily: 'Georgia, serif', margin: 0, color: '#111', fontWeight: 700 }}>
                            Editor de Dados
                        </h2>
                        <div style={{ display: 'flex', background: '#e5e5e5', borderRadius: 6, padding: 3 }}>
                            <button
                                onClick={() => setJsonMode(false)}
                                style={{
                                    border: 'none',
                                    background: !jsonMode ? 'white' : 'transparent',
                                    padding: '5px 12px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: !jsonMode ? 600 : 400,
                                    boxShadow: !jsonMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Tabela
                            </button>
                            <button
                                onClick={() => setJsonMode(true)}
                                style={{
                                    border: 'none',
                                    background: jsonMode ? 'white' : 'transparent',
                                    padding: '5px 12px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: jsonMode ? 600 : 400,
                                    boxShadow: jsonMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                JSON
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        border: 'none', background: '#eee', width: 32, height: 32, borderRadius: '50%', fontSize: 18, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        ✕
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 24,
                    background: 'white'
                }}>
                    {jsonMode ? (
                        <textarea
                            value={JSON.stringify(data, null, 2)}
                            onChange={(e) => {
                                try {
                                    setData(JSON.parse(e.target.value));
                                } catch (err) {
                                    // Allow typing invalid json
                                }
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: '1px solid #eee',
                                borderRadius: 8,
                                padding: 20,
                                fontFamily: 'monospace',
                                fontSize: 13,
                                resize: 'none',
                                background: '#f8f9fa',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <div style={{ maxWidth: '100%' }}>
                            <SimpleDataEditor
                                data={data}
                                onChange={setData}
                                chartType={chartType}
                                datasetTypes={datasetTypes}
                                onDatasetTypeChange={(index, type) => {
                                    const currentTypes = datasetTypes || new Array(data.datasets.length).fill('bar');
                                    const newTypes = [...currentTypes];
                                    newTypes[index] = type;
                                    setDatasetTypes(newTypes);
                                }}
                            />
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '20px 24px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 12,
                    background: '#fafafa'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 24px',
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#555',
                            fontWeight: 500
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 24px',
                            background: '#111',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    >
                        Aplicar Alterações
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
