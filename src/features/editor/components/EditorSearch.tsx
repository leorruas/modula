import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { Project, Chart } from '@/types';
import { chartService } from '@/services/chartService';

interface EditorSearchProps {
    project: Project;
}

export function EditorSearch({ project }: EditorSearchProps) {
    const { setActivePage, setEditingChartId, setHighlightChartId } = useEditorStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ type: 'chart' | 'page', id: string | number, label: string, subLabel?: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [charts, setCharts] = useState<Chart[]>([]);

    // Load all charts for search
    useEffect(() => {
        chartService.getProjectCharts(project.id).then(setCharts);
    }, [project.id]);

    // Handle search and default view
    useEffect(() => {
        if (!query.trim()) {
            // Show all chapters by default when empty
            if (project.chapters && project.chapters.length > 0) {
                const chapterResults = project.chapters.map(c => ({
                    type: 'page' as const,
                    id: c.startPage,
                    label: c.title,
                    subLabel: `Capítulo / Página ${c.startPage}`
                }));
                // Need to cast or adjust state type if slightly different, but it matches
                setResults(chapterResults);
                return;
            }
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const searchResults: typeof results = [];

        // Search Chapters
        if (project.chapters) {
            project.chapters.forEach((chapter) => {
                if (chapter.title.toLowerCase().includes(lowerQuery)) {
                    searchResults.push({
                        type: 'page',
                        id: chapter.startPage,
                        label: chapter.title,
                        subLabel: `Capítulo inicia na página ${chapter.startPage}`
                    });
                }
            });
        }

        // Search Charts
        charts.forEach(chart => {
            const matchName = chart.name?.toLowerCase().includes(lowerQuery);
            const matchNotes = chart.notes?.toLowerCase().includes(lowerQuery);

            if (matchName || matchNotes) {
                searchResults.push({
                    type: 'chart',
                    id: chart.id,
                    label: chart.name || 'Gráfico sem nome',
                    subLabel: `Página ${chart.page || 1} • ${chart.type} ${matchNotes ? '• (Nota encontrada)' : ''}`
                });
            }
        });

        setResults(searchResults);
        setIsOpen(true);
    }, [query, project.chapters, charts]);

    const handleSelect = (result: typeof results[0]) => {
        if (result.type === 'page') {
            setActivePage(result.id as number);
        } else if (result.type === 'chart') {
            const chart = charts.find(c => c.id === result.id);
            if (chart) {
                setActivePage(chart.page || 1);
                setEditingChartId(chart.id);
                // Optional: Highlight effect
                setHighlightChartId(chart.id);
                setTimeout(() => setHighlightChartId(null), 2000);
            }
        }
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div style={{ position: 'relative', width: 250 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f5f5f5',
                borderRadius: 6,
                padding: '4px 8px',
                border: '1px solid #e5e5e5'
            }}>
                <Search size={14} color="#999" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar ou Navegar..."
                    style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: 13,
                        marginLeft: 6,
                        width: '100%',
                        outline: 'none',
                        color: '#111',
                        fontWeight: 500
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 5,
                    background: 'white',
                    borderRadius: 6,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e5e5',
                    zIndex: 1000,
                    maxHeight: 300,
                    overflowY: 'auto'
                }}>
                    {results.map((result, i) => (
                        <div
                            key={i}
                            onMouseDown={() => handleSelect(result)}
                            style={{
                                padding: '8px 12px',
                                borderBottom: '1px solid #f5f5f5',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            className="hover:bg-gray-50"
                        >
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{result.label}</div>
                            {result.subLabel && (
                                <div style={{ fontSize: 11, color: '#888' }}>{result.subLabel}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
