import { useState, useEffect } from 'react';
import { ChartData } from '@/types';

interface SimpleDataEditorProps {
    data: ChartData;
    onChange: (newData: ChartData) => void;
    chartType?: string;
    datasetTypes?: ('bar' | 'line')[];
    onDatasetTypeChange?: (index: number, type: 'bar' | 'line') => void;
}

export function SimpleDataEditor({ data, onChange, chartType, datasetTypes, onDatasetTypeChange }: SimpleDataEditorProps) {
    // Local state for the table to avoid jitter
    // We assume data has labels and datasets
    // Structure: 
    // Rows = labels.length
    // Cols = 1 (Label) + datasets.length

    const handleLabelChange = (index: number, value: string) => {
        const newLabels = [...data.labels];
        newLabels[index] = value;
        onChange({ ...data, labels: newLabels });
    };

    const handleValueChange = (datasetIndex: number, dataIndex: number, value: string) => {
        const newDatasets = [...data.datasets];
        const numValue = parseFloat(value);
        newDatasets[datasetIndex].data[dataIndex] = isNaN(numValue) ? 0 : numValue;
        onChange({ ...data, datasets: newDatasets });
    };

    const handleSeriesNameChange = (datasetIndex: number, value: string) => {
        const newDatasets = [...data.datasets];
        newDatasets[datasetIndex].label = value;
        onChange({ ...data, datasets: newDatasets });
    };

    const addRow = () => {
        const newLabels = [...data.labels, `Item ${data.labels.length + 1}`];
        const newDatasets = data.datasets.map(d => ({
            ...d,
            data: [...d.data, 0]
        }));
        onChange({ labels: newLabels, datasets: newDatasets });
    };

    const removeRow = (index: number) => {
        const newLabels = data.labels.filter((_, i) => i !== index);
        const newDatasets = data.datasets.map(d => ({
            ...d,
            data: d.data.filter((_, i) => i !== index)
        }));
        onChange({ labels: newLabels, datasets: newDatasets });
    };

    const addSeries = () => {
        const newDataset = {
            label: `Série ${data.datasets.length + 1}`,
            data: new Array(data.labels.length).fill(0)
        };
        onChange({ ...data, datasets: [...data.datasets, newDataset] });
    };

    const removeSeries = (index: number) => {
        if (data.datasets.length <= 1) return; // Keep at least one
        const newDatasets = data.datasets.filter((_, i) => i !== index);
        onChange({ ...data, datasets: newDatasets });
    };

    return (
        <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                        <th style={{ padding: 8, textAlign: 'left', minWidth: 100, color: '#444' }}>Categoria</th>
                        {data.datasets.map((ds, i) => (
                            <th key={i} style={{ padding: 8, minWidth: 80, position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                        type="text"
                                        value={ds.label}
                                        onChange={(e) => handleSeriesNameChange(i, e.target.value)}
                                        style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 600, color: '#333' }}
                                    />
                                    {data.datasets.length > 1 && (
                                        <button onClick={() => removeSeries(i)} style={{ border: 'none', background: 'transparent', color: '#999', cursor: 'pointer', fontSize: 10 }}>×</button>
                                    )}
                                </div>
                                {chartType === 'mixed' && onDatasetTypeChange && (
                                    <div style={{ marginTop: 4, display: 'flex', gap: 2 }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDatasetTypeChange(i, 'bar');
                                            }}
                                            style={{
                                                flex: 1,
                                                fontSize: 9,
                                                padding: '2px',
                                                border: '1px solid',
                                                borderColor: (!datasetTypes || datasetTypes[i] === 'bar') ? '#0ea5e9' : '#e5e5e5', // Default to bar if undefined
                                                background: (!datasetTypes || datasetTypes[i] === 'bar') ? '#0ea5e9' : 'transparent',
                                                color: (!datasetTypes || datasetTypes[i] === 'bar') ? 'white' : '#999',
                                                borderRadius: 3,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Barra
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onDatasetTypeChange(i, 'line');
                                            }}
                                            style={{
                                                flex: 1,
                                                fontSize: 9,
                                                padding: '2px',
                                                border: '1px solid',
                                                borderColor: datasetTypes?.[i] === 'line' ? '#8b5cf6' : '#e5e5e5',
                                                background: datasetTypes?.[i] === 'line' ? '#8b5cf6' : 'transparent',
                                                color: datasetTypes?.[i] === 'line' ? 'white' : '#999',
                                                borderRadius: 3,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Linha
                                        </button>
                                    </div>
                                )}
                            </th>
                        ))}
                        <th style={{ padding: 8, width: 30 }}>
                            <button onClick={addSeries} title="Adicionar Série" style={{ border: 'none', background: '#e0e0e0', borderRadius: 3, width: 20, height: 20, cursor: 'pointer', color: '#333' }}>+</button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.labels.map((label, rowIndex) => (
                        <tr key={rowIndex} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: 4 }}>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => handleLabelChange(rowIndex, e.target.value)}
                                    style={{ width: '100%', border: 'none', padding: 4, background: '#fafafa', borderRadius: 2 }}
                                />
                            </td>
                            {data.datasets.map((ds, colIndex) => (
                                <td key={colIndex} style={{ padding: 4 }}>
                                    <input
                                        type="number"
                                        value={ds.data[rowIndex]}
                                        onChange={(e) => handleValueChange(colIndex, rowIndex, e.target.value)}
                                        style={{ width: '100%', border: 'none', padding: 4, textAlign: 'right' }}
                                    />
                                </td>
                            ))}
                            <td style={{ padding: 4, textAlign: 'center' }}>
                                <button
                                    onClick={() => removeRow(rowIndex)}
                                    style={{ border: 'none', background: 'transparent', color: '#ccc', cursor: 'pointer', fontWeight: 'bold' }}
                                    className="hover-danger"
                                >
                                    ×
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={data.datasets.length + 2} style={{ padding: 8 }}>
                            <button
                                onClick={addRow}
                                style={{ width: '100%', padding: 6, background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 4, color: '#666', fontSize: 12, cursor: 'pointer' }}
                            >
                                + Adicionar Linha
                            </button>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div >
    );
}
