import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { getAllIcons, ICON_CATEGORIES, getIconComponent, getAllLucideIconKeys } from '@/utils/iconLibrary';


interface IconSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectIcon: (category: string, iconKey: string) => void;
    currentIcon?: { category: string; iconKey: string };
}

export function IconSelectorModal({ isOpen, onClose, onSelectIcon, currentIcon }: IconSelectorModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('people');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleLimit, setVisibleLimit] = useState(200);

    const allLucideIcons = useMemo(() => getAllLucideIconKeys(), []);
    const categorizedIcons = getAllIcons();

    if (!isOpen) return null;

    // Determine which pool of icons to use
    let sourceIcons: string[] = [];
    if (selectedCategory === 'all') {
        sourceIcons = allLucideIcons;
    } else {
        sourceIcons = categorizedIcons[selectedCategory as keyof typeof categorizedIcons] || [];
    }

    // Filter icons based on search query
    // If searching, we might want to search ACROSS ALL categories if the user is in a category? 
    // Or just search within current? The prompt implied "All" category for full search.
    // Let's stick to searching within the selected category, but maybe switch to 'all' if user wants?
    // Actually, widespread pattern is: if search is active, show results from everywhere? 
    // The plan said: "When 'All' is selected or when searching, query against the entire LucideIcons set."

    // Let's enforce: If there is a search query, we automatically search ALL icons, effectively behaving like 'all' category but filtered.
    // Or we can keep the category selection but if search is present, maybe hint?
    // Plan: "Ensure search filters the entire list." -> implied we search everything.

    const isSearching = searchQuery.length > 0;
    const iconsToFilter = (isSearching || selectedCategory === 'all') ? allLucideIcons : sourceIcons;

    const filteredIcons = searchQuery
        ? allLucideIcons.filter((icon: string) => icon.toLowerCase().includes(searchQuery.toLowerCase()))
        : sourceIcons;

    // Reset limit when query or category changes
    // We can't do this easily in render, better to do in handlers or effects. 
    // For now, let's just slice. We'll handle reset in onChange.

    const visibleIcons = filteredIcons.slice(0, visibleLimit);
    const hasMore = visibleIcons.length < filteredIcons.length;

    const categoryLabels: Record<string, string> = {
        all: '🌐 Todos',
        people: '👥 Pessoas',
        education: '🎓 Educação',
        business: '💼 Negócios',
        tech: '💻 Tecnologia',
        places: '🏠 Lugares',
        symbols: '⭐ Símbolos'
    };

    const handleSelect = (iconKey: string) => {
        // If we are in 'all' or searching, the category is technically 'all' or we find the original category?
        // Simpler to just pass 'all' or the actual found category if we want to be precise.
        // But getIconComponent now falls back to generic lookup, so passing 'all' or 'custom' works fine if we update it.
        // To be safe and compatible with existing structure if it cares about category names for other things:
        // Actually the backend/storage likely just stores string references.
        // Let's pass 'all' if selectedCategory is all or searching.
        const catToSave = (isSearching || selectedCategory === 'all') ? 'all' : selectedCategory;
        onSelectIcon(catToSave, iconKey);
        onClose();
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setVisibleLimit(100); // Reset limit on search
        if (e.target.value.length > 0 && selectedCategory !== 'all') {
            // Optional: Auto-switch to 'all'? No, let's just filter 'all' effectively as per logic above.
            // Actually, the UI tabs might look confusing if we are in "People" but seeing results from "Tech".
            // Let's just search within 'all' logic-wise but visually maybe switch tab?
            // Or let's keep it simple: If searching, we display matches from ALL icons.
            setSelectedCategory('all');
        }
    };

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        setSearchQuery(''); // Clear search when switching category? Or keep it? Clear is safer.
        setVisibleLimit(100);
    };

    const handleLoadMore = () => {
        setVisibleLimit(prev => prev + 100);
    };

    // Use Portal to render outside the sidebar stacking context
    if (typeof document === 'undefined') return null;

    return (
        <>
            {/* Styles for Portal */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>

            {ReactDOM.createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={onClose}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: 16,
                            width: '90%',
                            maxWidth: 1000,
                            height: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                            animation: 'scaleIn 0.2s ease-out'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '24px 32px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#fff'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111' }}>Selecionar Ícone</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#666' }}>Escolha um ícone para representar seus dados</p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    background: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 40,
                                    height: 40,
                                    fontSize: 24,
                                    cursor: 'pointer',
                                    color: '#666',
                                    transition: 'all 0.2s',
                                    lineHeight: 1
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#666'; }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Sub-header with Search and Tabs */}
                        <div style={{
                            padding: '20px 32px',
                            background: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16
                        }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar ícone (ex: user, chart, arrow)..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 42px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                            </div>

                            {/* Category Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: 8,
                                overflowX: 'auto',
                                paddingBottom: 4,
                                scrollbarWidth: 'none'
                            }}>
                                {/* Add All option manually */}
                                <button
                                    key="all"
                                    onClick={() => handleCategoryChange('all')}
                                    style={{
                                        padding: '8px 16px',
                                        border: selectedCategory === 'all' ? '1px solid #0284c7' : '1px solid #e5e7eb',
                                        borderRadius: 20,
                                        background: selectedCategory === 'all' ? '#e0f2fe' : 'white',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: selectedCategory === 'all' ? 600 : 500,
                                        color: selectedCategory === 'all' ? '#0284c7' : '#4b5563',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {categoryLabels['all']}
                                </button>

                                {Object.keys(ICON_CATEGORIES).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryChange(cat)}
                                        style={{
                                            padding: '8px 16px',
                                            border: selectedCategory === cat ? '1px solid #0284c7' : '1px solid #e5e7eb',
                                            borderRadius: 20,
                                            background: selectedCategory === cat ? '#e0f2fe' : 'white',
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: selectedCategory === cat ? 600 : 500,
                                            color: selectedCategory === cat ? '#0284c7' : '#4b5563',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {categoryLabels[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Icon Grid */}
                        <div style={{
                            padding: 32,
                            overflowY: 'auto',
                            flex: 1,
                            background: '#fdfdfd'
                        }}>
                            {filteredIcons.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#9ca3af', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: 48, marginBottom: 16 }}>👻</span>
                                    <span style={{ fontSize: 18, fontWeight: 500 }}>Nenhum ícone encontrado</span>
                                    <span style={{ fontSize: 14 }}>Tente buscar por outro termo ou mude a categoria</span>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                        gap: 12
                                    }}>
                                        {visibleIcons.map((iconKey: string) => {
                                            // Pass 'all' if category is 'all' to trigger safe fallback
                                            const IconComponent = getIconComponent(selectedCategory === 'all' ? 'all' : selectedCategory, iconKey) || getIconComponent('all', iconKey);
                                            const isSelected = currentIcon?.iconKey === iconKey;

                                            if (!IconComponent) return null;

                                            return (
                                                <button
                                                    key={iconKey}
                                                    onClick={() => handleSelect(iconKey)}
                                                    style={{
                                                        padding: 16,
                                                        border: isSelected ? '2px solid #0ea5e9' : '1px solid #f3f4f6',
                                                        borderRadius: 12,
                                                        background: isSelected ? '#f0f9ff' : 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 12,
                                                        transition: 'all 0.2s',
                                                        aspectRatio: '1',
                                                        boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                                                    }}
                                                    title={iconKey}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.borderColor = '#0ea5e9';
                                                            e.currentTarget.style.background = '#f8fafc';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.borderColor = '#f3f4f6';
                                                            e.currentTarget.style.background = 'white';
                                                            e.currentTarget.style.transform = 'none';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    <IconComponent size={28} strokeWidth={1.5} color={isSelected ? '#0ea5e9' : '#374151'} />
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: isSelected ? '#0369a1' : '#6b7280',
                                                        textAlign: 'center',
                                                        lineHeight: 1.2,
                                                        maxWidth: '100%',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        width: '100%'
                                                    }}>
                                                        {iconKey}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {hasMore && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                                            <button
                                                onClick={handleLoadMore}
                                                style={{
                                                    padding: '10px 32px',
                                                    background: '#fff',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: 30,
                                                    color: '#374151',
                                                    cursor: 'pointer',
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            >
                                                Carregar mais ícones
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '16px 32px',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f9fafb',
                            fontSize: 12,
                            color: '#6b7280'
                        }}>
                            <div>
                                Exibindo <strong style={{ color: '#111' }}>{visibleIcons.length}</strong> de {filteredIcons.length} ícones
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '8px 24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 6,
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: '#374151',
                                    transition: 'all 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
