/**
 * Icon Library for Infographic Charts
 * Categorized icons from Lucide and Heroicons
 */

import {
    User, Users, UserCircle,
    GraduationCap, BookOpen, School,
    Briefcase, TrendingUp, DollarSign,
    Laptop, Smartphone, Server,
    Home, Building, Factory,
    Heart, Star, Award
} from 'lucide-react';

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
            student: { component: GraduationCap, label: 'Estudante' },
            book: { component: BookOpen, label: 'Livro' },
            school: { component: School, label: 'Escola' }
        }
    },
    business: {
        name: 'Negócios',
        icons: {
            briefcase: { component: Briefcase, label: 'Maleta' },
            chart: { component: TrendingUp, label: 'Gráfico' },
            money: { component: DollarSign, label: 'Dinheiro' }
        }
    },
    tech: {
        name: 'Tecnologia',
        icons: {
            laptop: { component: Laptop, label: 'Laptop' },
            phone: { component: Smartphone, label: 'Celular' },
            server: { component: Server, label: 'Servidor' }
        }
    },
    places: {
        name: 'Lugares',
        icons: {
            home: { component: Home, label: 'Casa' },
            building: { component: Building, label: 'Prédio' },
            factory: { component: Factory, label: 'Fábrica' }
        }
    },
    symbols: {
        name: 'Símbolos',
        icons: {
            heart: { component: Heart, label: 'Coração' },
            star: { component: Star, label: 'Estrela' },
            award: { component: Award, label: 'Prêmio' }
        }
    }
};

export type IconCategoryKey = keyof typeof ICON_CATEGORIES;
export type IconKey<T extends IconCategoryKey> = keyof typeof ICON_CATEGORIES[T]['icons'];

/**
 * Get icon component by category and key
 */
export function getIcon(category: IconCategoryKey, iconKey: string) {
    const categoryIcons = ICON_CATEGORIES[category].icons;
    const iconData = categoryIcons[iconKey as keyof typeof categoryIcons];
    return iconData?.component;
}

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
 * Get Lucide component name from icon key
 */
export function getIconComponent(category: string, iconKey: string) {
    const cat = ICON_CATEGORIES[category as keyof typeof ICON_CATEGORIES];
    if (!cat) return null;

    const iconData = cat.icons[iconKey as keyof typeof cat.icons];
    return iconData?.component || null;
}
