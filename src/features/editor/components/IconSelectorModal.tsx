import { useState, useMemo } from 'react';
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

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: 8,
                    width: 600,
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Selecionar Ícone</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 24,
                            cursor: 'pointer',
                            color: '#666',
                            padding: 0,
                            width: 32,
                            height: 32
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                    <input
                        type="text"
                        placeholder="Buscar em todos os ícones..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            fontSize: 14
                        }}
                    />
                </div>

                {/* Category Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 8,
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    overflowX: 'auto'
                }}>
                    {/* Add All option manually */}
                    <button
                        key="all"
                        onClick={() => handleCategoryChange('all')}
                        style={{
                            padding: '6px 12px',
                            border: selectedCategory === 'all' ? '2px solid #00D9FF' : '1px solid #ddd',
                            borderRadius: 4,
                            background: selectedCategory === 'all' ? '#E6FAFF' : 'white',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: selectedCategory === 'all' ? 600 : 400,
                            color: selectedCategory === 'all' ? '#00A0CC' : '#666',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {categoryLabels['all']}
                    </button>

                    {Object.keys(ICON_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            style={{
                                padding: '6px 12px',
                                border: selectedCategory === cat ? '2px solid #00D9FF' : '1px solid #ddd',
                                borderRadius: 4,
                                background: selectedCategory === cat ? '#E6FAFF' : 'white',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: selectedCategory === cat ? 600 : 400,
                                color: selectedCategory === cat ? '#00A0CC' : '#666',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {categoryLabels[cat]}
                        </button>
                    ))}
                </div>

                {/* Icon Grid */}
                <div style={{
                    padding: 24,
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {filteredIcons.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                            Nenhum ícone encontrado
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: 12
                            }}>
                                {visibleIcons.map((iconKey: string) => {
                                    // Pass 'all' if category is 'all' to trigger safe fallback
                                    const IconComponent = getIconComponent(selectedCategory === 'all' ? 'all' : selectedCategory, iconKey) || getIconComponent('all', iconKey);
                                    const isSelected = currentIcon?.iconKey === iconKey; // Simple check purely on key name for visual feedback

                                    if (!IconComponent) return null;

                                    return (
                                        <button
                                            key={iconKey}
                                            onClick={() => handleSelect(iconKey)}
                                            style={{
                                                padding: 16,
                                                border: isSelected ? '2px solid #00D9FF' : '1px solid #e0e0e0',
                                                borderRadius: 6,
                                                background: isSelected ? '#E6FAFF' : 'white',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 8,
                                                transition: 'all 0.2s',
                                                height: 90
                                            }}
                                            title={iconKey}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = '#00D9FF';
                                                    e.currentTarget.style.background = '#f9f9f9';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                                    e.currentTarget.style.background = 'white';
                                                }
                                            }}
                                        >
                                            <IconComponent size={24} strokeWidth={2} />
                                            <span style={{
                                                fontSize: 9,
                                                color: '#666',
                                                textAlign: 'center',
                                                lineHeight: 1.2,
                                                maxWidth: '100%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {iconKey}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                                    <button
                                        onClick={handleLoadMore}
                                        style={{
                                            padding: '8px 24px',
                                            background: '#f0f0f0',
                                            border: 'none',
                                            borderRadius: 20,
                                            color: '#666',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            fontWeight: 500
                                        }}
                                    >
                                        Carregar mais ícones...
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: 12, color: '#666' }}>
                        {visibleIcons.length} de {filteredIcons.length} ícones
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: 13
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
