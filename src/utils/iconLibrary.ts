/**
 * Icon Library for Infographic Charts
 * Categorized icons from Lucide and Heroicons
 */

import { LucideIcon, User, Users, UserCircle, Briefcase, Building, Home, MapPin, Phone, Mail, Globe, Calendar, Clock, Lock, Shield, Settings, Search, Menu, X, ChevronDown, ChevronRight, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import React from 'react';

// Keep explicitly imported icons for the Categories if needed, 
// OR just reference them from the namespace to clean up imports.
// For backward compatibility and specific category logic, we keep the structure but reference the namespace.

export const ICON_CATEGORIES = {
    people: {
        name: 'Pessoas',
        icons: {
            person: { component: User, label: 'Pessoa' },
            people: { component: Users, label: 'Pessoas' },
            user: { component: UserCircle, label: 'Usuário' }
        }
    },
    education: {
        name: 'Educação',
        icons: {
            // These will now be dynamically loaded if not explicitly imported
            student: { component: dynamic(dynamicIconImports['graduation-cap']), label: 'Estudante' },
            book: { component: dynamic(dynamicIconImports['book-open']), label: 'Livro' },
            school: { component: dynamic(dynamicIconImports['school']), label: 'Escola' }
        }
    },
    business: {
        name: 'Negócios',
        icons: {
            briefcase: { component: Briefcase, label: 'Maleta' },
            chart: { component: dynamic(dynamicIconImports['trending-up']), label: 'Gráfico' },
            money: { component: dynamic(dynamicIconImports['dollar-sign']), label: 'Dinheiro' }
        }
    },
    tech: {
        name: 'Tecnologia',
        icons: {
            laptop: { component: dynamic(dynamicIconImports['laptop']), label: 'Laptop' },
            phone: { component: dynamic(dynamicIconImports['smartphone']), label: 'Celular' },
            server: { component: dynamic(dynamicIconImports['server']), label: 'Servidor' }
        }
    },
    places: {
        name: 'Lugares',
        icons: {
            home: { component: Home, label: 'Casa' },
            building: { component: Building, label: 'Prédio' },
            factory: { component: dynamic(dynamicIconImports['factory']), label: 'Fábrica' }
        }
    },
    symbols: {
        name: 'Símbolos',
        icons: {
            heart: { component: dynamic(dynamicIconImports['heart']), label: 'Coração' },
            star: { component: dynamic(dynamicIconImports['star']), label: 'Estrela' },
            award: { component: dynamic(dynamicIconImports['award']), label: 'Prêmio' }
        }
    }
};

export type IconCategoryKey = keyof typeof ICON_CATEGORIES;



/**
 * Get all available icons grouped by category
 */
export function getAllIcons() {
    const result: Record<string, string[]> = {};

    Object.entries(ICON_CATEGORIES).forEach(([catKey, catData]) => {
        result[catKey] = Object.keys(catData.icons);
    });

    return result;
}

/**
 * Get all Lucide component keys from the dynamic imports map
 */
export function getAllLucideIconKeys() {
    return Object.keys(dynamicIconImports);
}

// Cache to store created dynamic components and prevent re-creation on every render
const iconCache = new Map<string, React.ComponentType<any>>();

/**
 * Get Lucide component from icon key
 * First checks categories (static imports), then falls back to dynamic imports
 */
export function getIconComponent(category: string, iconKey: string) {
    // 1. Try to find in specific category first (preserves static imports for common icons)
    if (category !== 'all' && category in ICON_CATEGORIES) {
        const cat = ICON_CATEGORIES[category as keyof typeof ICON_CATEGORIES];
        const iconData = cat.icons[iconKey as keyof typeof cat.icons] as { component: any; label: string } | undefined;
        if (iconData?.component) return iconData.component;
    }

    // 2. Dynamic import fallback
    // Check cache first
    if (iconCache.has(iconKey)) {
        return iconCache.get(iconKey);
    }

    // 3. Dynamic import directly from package (bypassing dynamicIconImports map to ensure bundler picks it up)
    // using a template string allows Webpack to create a context for the icons directory
    try {
        const Component = dynamic(() =>
            import(`lucide-react/dist/esm/icons/${iconKey}.js`)
                .catch(err => {
                    console.warn(`[Modula] Failed to load icon: ${iconKey}`, err);
                    return { default: () => React.createElement('svg', { width: 24, height: 24, viewBox: "0 0 24 24" }, React.createElement('rect', { width: 24, height: 24, fill: '#fee', rx: 4 })) };
                }),
            {
                // Use an SVG-compatible loading placeholder (important for usage inside SVG charts)
                loading: () => React.createElement('svg', { width: 24, height: 24, viewBox: "0 0 24 24", style: { opacity: 0.5 } }, React.createElement('rect', { width: 24, height: 24, fill: '#e0e0e0', rx: 4 })),
                ssr: false
            }
        );
        iconCache.set(iconKey, Component);
        return Component;
    } catch (e) {
        console.error(`[Modula] Error creating dynamic import for ${iconKey}`, e);
        return null;
    }
}

/**
 * Legacy wrapper for backward compatibility
 */
export function getIcon(category: IconCategoryKey, iconKey: string) {
    return getIconComponent(category, iconKey);
}
