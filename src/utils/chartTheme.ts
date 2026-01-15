/**
 * Chart Theme and Design System
 * Editorial-quality visual constants for charts
 */

export const CHART_THEME = {
    // Colors - Dual Palette System
    colors: {
        // Pastel Editorial (Inspired by references)
        pastel: {
            coral: '#FF8A80',
            salmon: '#FFB3AD',
            beige: '#F5E6D3',
            navy: '#2C3E50',
            lightCoral: '#FFCDD2'
        },
        // Vibrant Modern
        vibrant: {
            lime: '#D4FF00',
            cyan: '#00D9FF',
            turquoise: '#00BFA6',
            purple: '#9C27B0',
            orange: '#FF6F00'
        },
        // Default primary palette (vibrant)
        primary: ['#00D9FF', '#00BFA6', '#FF8A80', '#9C27B0', '#D4FF00'],
        neutral: {
            dark: '#1a1a1a',
            medium: '#666666',
            light: '#999999',
            lighter: '#e5e5e5',
            lightest: '#f5f5f5'
        },
        background: '#ffffff'
    },

    // Typography - Numbers are KINGS
    fonts: {
        label: 'system-ui, -apple-system, sans-serif',
        value: 'system-ui, -apple-system, sans-serif', // Changed to sans-serif for infographics
        title: 'system-ui, -apple-system, sans-serif',
        number: 'system-ui, -apple-system, sans-serif' // For hero numbers
    },

    fontSizes: {
        tiny: 9,
        small: 11,
        medium: 13,
        large: 16,
        huge: 56,      // Was 48 - BIGGER for dramatic effect
        giant: 72,     // Was 64 - Even BIGGER
        extraGiant: 96 // NEW - For super hero numbers
    },

    fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 900
    },

    // Spacing - VERY generous for infographic
    padding: {
        small: 30,
        medium: 50,
        large: 100  // Was 70 - MUCH bigger spacing
    },

    // Visual effects - Minimal and subtle
    effects: {
        gridOpacity: 0, // NO GRID LINES
        axisOpacity: 0.2, // Very subtle axis
        shadowBlur: 8,
        shadowOpacity: 0.03, // Super subtle
        borderRadius: 6
    },

    // Stroke widths
    strokeWidths: {
        grid: 0, // No grid
        axis: 1,
        line: 3,
        border: 0 // No borders
    }
};

/**
 * Generate gradient definitions for SVG
 */
export const createGradient = (id: string, color: string, direction: 'vertical' | 'horizontal' = 'vertical') => {
    const [x1, y1, x2, y2] = direction === 'vertical' ? [0, 0, 0, 1] : [0, 0, 1, 0];

    return `
        <defs>
            <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
                <stop offset="0%" stop-color="${color}" stop-opacity="0.8" />
                <stop offset="100%" stop-color="${color}" stop-opacity="0.3" />
            </linearGradient>
        </defs>
    `;
};

/**
 * Apply drop shadow filter to SVG
 */
export const createShadowFilter = (id: string) => {
    return `
        <defs>
            <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="${CHART_THEME.effects.shadowBlur}" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="${CHART_THEME.effects.shadowOpacity}" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    `;
};

/**
 * Get color from palette with fallback
 */
export const getChartColor = (index: number, customPalette?: string[]): string => {
    if (customPalette && customPalette.length > 0) {
        return customPalette[index % customPalette.length];
    }
    return CHART_THEME.colors.primary[index % CHART_THEME.colors.primary.length];
};

/**
 * Color Presets - User-selectable palettes
 */
export const COLOR_PRESETS = {
    editorialPastel: {
        name: 'Editorial Pastel',
        colors: ['#FF8A80', '#FFB3AD', '#F5E6D3', '#B2DFDB', '#FFCDD2']
    },
    vibrantModern: {
        name: 'Vibrant Modern',
        colors: ['#00D9FF', '#D4FF00', '#00BFA6', '#9C27B0', '#FF6F00']
    },
    classicBusiness: {
        name: 'Classic Business',
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    },
    monochrome: {
        name: 'Monochrome + Accent',
        colors: ['#1a1a1a', '#666666', '#00D9FF', '#999999', '#cccccc']
    }
};

export type ColorPresetKey = keyof typeof COLOR_PRESETS;
