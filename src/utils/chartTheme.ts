/**
 * Chart Theme and Design System
 * Editorial-quality visual constants for charts
 */

export const CHART_THEME = {
    // Colors - Sophisticated palette
    colors: {
        primary: ['#4f46e5', '#7c3aed', '#2563eb', '#0891b2', '#059669'],
        secondary: ['#ec4899', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6'],
        neutral: {
            dark: '#1f2937',
            medium: '#6b7280',
            light: '#9ca3af',
            lighter: '#e5e7eb',
            lightest: '#f3f4f6'
        },
        background: '#ffffff'
    },

    // Typography
    fonts: {
        label: 'system-ui, -apple-system, sans-serif',
        value: 'Georgia, serif',
        title: 'Georgia, serif'
    },

    fontSizes: {
        small: 10,
        medium: 12,
        large: 14,
        title: 16
    },

    fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
    },

    // Spacing
    padding: {
        small: 20,
        medium: 30,
        large: 40
    },

    // Visual effects
    effects: {
        gridOpacity: 0.15,
        axisOpacity: 0.4,
        shadowBlur: 4,
        shadowOpacity: 0.1,
        borderRadius: 2
    },

    // Stroke widths
    strokeWidths: {
        grid: 1,
        axis: 1.5,
        line: 2.5,
        border: 1
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
