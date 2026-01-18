'use client';

import { useState, useEffect } from 'react';
import { ChartData } from '@/types';
import { SimpleDataEditor } from './SimpleDataEditor';

interface DataEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ChartData;
    onSave: (data: ChartData) => void;
}

export function DataEditorModal({ isOpen, onClose, initialData, onSave }: DataEditorModalProps) {
    const [data, setData] = useState<ChartData>(initialData);
    const [jsonMode, setJsonMode] = useState(false);

    // Reset data when modal opens
    useEffect(() => {
        if (isOpen) {
            setData(initialData);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(data);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white',
                width: 900,
                maxWidth: '95vw',
                height: '80vh',
                borderRadius: 8,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fafafa'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <h2 style={{ fontSize: 18, fontFamily: 'Georgia, serif', margin: 0, color: '#111' }}>
                            Editor de Dados
                        </h2>
                        <div style={{ display: 'flex', background: '#e5e5e5', borderRadius: 4, padding: 2 }}>
                            <button
                                onClick={() => setJsonMode(false)}
                                style={{
                                    border: 'none',
                                    background: !jsonMode ? 'white' : 'transparent',
                                    padding: '4px 10px',
                                    borderRadius: 3,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: !jsonMode ? 600 : 400,
                                    boxShadow: !jsonMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Tabela
                            </button>
                            <button
                                onClick={() => setJsonMode(true)}
                                style={{
                                    border: 'none',
                                    background: jsonMode ? 'white' : 'transparent',
                                    padding: '4px 10px',
                                    borderRadius: 3,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: jsonMode ? 600 : 400,
                                    boxShadow: jsonMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                JSON
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#999'
                    }}>
                        ✕
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 20,
                    background: 'white'
                }}>
                    {jsonMode ? (
                        <textarea
                            value={JSON.stringify(data, null, 2)}
                            onChange={(e) => {
                                try {
                                    setData(JSON.parse(e.target.value));
                                } catch (err) {
                                    // Allow typing invalid json, validate on blur or save if needed
                                }
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: '1px solid #eee',
                                borderRadius: 4,
                                padding: 15,
                                fontFamily: 'monospace',
                                fontSize: 13,
                                resize: 'none',
                                background: '#f8f9fa'
                            }}
                        />
                    ) : (
                        <div style={{ maxWidth: '100%' }}>
                            <SimpleDataEditor
                                data={data}
                                onChange={setData}
                            />
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '15px 20px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: '#fafafa'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#555'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 20px',
                            background: '#111',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600
                        }}
                    >
                        Aplicar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
}
