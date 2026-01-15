import { useState } from 'react';
import { getAllIcons, ICON_CATEGORIES, getIconComponent } from '@/utils/iconLibrary';
import * as Icons from 'lucide-react';

interface IconSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectIcon: (category: string, iconKey: string) => void;
    currentIcon?: { category: string; iconKey: string };
}

export function IconSelectorModal({ isOpen, onClose, onSelectIcon, currentIcon }: IconSelectorModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('people');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const allIcons = getAllIcons();
    const categoryIcons = allIcons[selectedCategory as keyof typeof allIcons] || [];

    const filteredIcons = searchQuery
        ? categoryIcons.filter((icon: string) => icon.toLowerCase().includes(searchQuery.toLowerCase()))
        : categoryIcons;

    const categoryLabels: Record<string, string> = {
        people: '👥 Pessoas',
        education: '🎓 Educação',
        business: '💼 Negócios',
        tech: '💻 Tecnologia',
        places: '🏠 Lugares',
        symbols: '⭐ Símbolos'
    };

    const handleSelect = (iconKey: string) => {
        onSelectIcon(selectedCategory, iconKey);
        onClose();
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
                        placeholder="Buscar ícone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                    {Object.keys(ICON_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
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
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: 12
                        }}>
                            {filteredIcons.map((iconKey: string) => {
                                const IconComponent = getIconComponent(selectedCategory, iconKey);
                                const isSelected = currentIcon?.category === selectedCategory && currentIcon?.iconKey === iconKey;

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
                                            transition: 'all 0.2s'
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
                                        {IconComponent && <IconComponent size={24} strokeWidth={2} />}
                                        <span style={{
                                            fontSize: 9,
                                            color: '#666',
                                            textAlign: 'center',
                                            lineHeight: 1.2,
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {iconKey}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
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
                        {filteredIcons.length} ícone{filteredIcons.length !== 1 ? 's' : ''} disponíve{filteredIcons.length !== 1 ? 'is' : 'l'}
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
