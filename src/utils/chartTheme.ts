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
        huge: 32,      // Was 56 - Reduced as per user feedback
        giant: 48,     // Was 72 - Reduced
        extraGiant: 64 // Was 96 - Reduced
    },

    fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 900
    },

    // Spacing - Tightened up to maximize data ink
    padding: {
        small: 10,  // Was 30
        medium: 25, // Was 50
        large: 50   // Was 100
    },

    // Layout spacing constants
    spacing: {
        axisTitle: 35,        // For charts with tick labels (e.g. BarChart)
        axisTitleCompact: 20  // For charts without Y-axis tick labels (e.g. Line, Column)
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
 * Generate radial gradient definitions for SVG (3D effect)
 */
export const createRadialGradient = (id: string, color: string) => {
    return `
        <defs>
            <radialGradient id="${id}" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
                <stop offset="100%" stop-color="${color}" stop-opacity="1" />
            </radialGradient>
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
 * Generate glass effect filter
 * Simulates glass with inner highlight, shadow, and blur
 */
/**
 * Creates an iOS-style "Liquid Glass" filter
 * Mimics inner glow/rim light using morphology
 */
/**
 * Creates an iOS-style "Liquid Glass" filter
 * uses morphological erosion to create a sharp rim light *inside* the shape
 */
export const createIOSGlassFilter = (id: string) => {
    return `
        <defs>
            <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
                
                <!-- 1. The Rim Light (Top/Left Highlight) -->
                <!-- Erode the alpha to shrink it by 1px -->
                <feMorphology in="SourceAlpha" operator="erode" radius="1.2" result="eroded" />
                <!-- Blur it slightly to soften -->
                <feGaussianBlur in="eroded" stdDeviation="0.8" result="blurredErode" />
                <!-- Cut the eroded part OUT of the original to leave just the edge -->
                <!-- Use 'out' to keep SourceAlpha where blurredErode is NOT -->
                <feComposite in="SourceAlpha" in2="blurredErode" operator="out" result="rimMask" />
                
                <!-- Color the rim white -->
                <feFlood flood-color="white" flood-opacity="0.95" result="whiteColor" />
                <feComposite in="whiteColor" in2="rimMask" operator="in" result="rimLight" />

                <!-- 2. The Inner Glow (Volume/Gummy feel) -->
                <feMorphology in="SourceAlpha" operator="erode" radius="4" result="deepErode" />
                <feGaussianBlur in="deepErode" stdDeviation="5" result="innerBlur" />
                <feComposite in="SourceAlpha" in2="innerBlur" operator="out" result="innerGlowMask" />
                <feFlood flood-color="white" flood-opacity="0.3" result="glowColor" />
                <feComposite in="glowColor" in2="innerGlowMask" operator="in" result="innerGlow" />

                <!-- 3. Soft Drop Shadow (Light transmission) -->
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="shadowBlur" />
                <feOffset dx="0" dy="3" in="shadowBlur" result="shadowOffset" />
                <feFlood flood-color="black" flood-opacity="0.1" result="shadowColor" />
                <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="dropShadow" />

                <!-- 4. Merge Stack -->
                <feMerge>
                    <feMergeNode in="dropShadow" />
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode in="innerGlow" />
                    <feMergeNode in="rimLight" />
                </feMerge>
            </filter>
        </defs>
    `;
};

export const createGlassGradient = (id: string, color: string) => {
    return `
        <defs>
            <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${color}" stop-opacity="0.85" />
                <stop offset="100%" stop-color="${color}" stop-opacity="0.4" />
            </linearGradient>
        </defs>
    `;
};

/**
 * Optimized Glass Filter for Thin Lines
 * Uses smaller erosion to prevent the line from disappearing
 */
export const createIOSGlassLineFilter = (id: string) => {
    return `
        <defs>
            <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
                <!-- 1. Rim Light (Gentler Erosion for Lines) -->
                <feMorphology in="SourceAlpha" operator="erode" radius="0.5" result="eroded" />
                <feGaussianBlur in="eroded" stdDeviation="0.4" result="blurredErode" />
                <feComposite in="SourceAlpha" in2="blurredErode" operator="out" result="rimMask" />
                
                <feFlood flood-color="white" flood-opacity="0.95" result="whiteColor" />
                <feComposite in="whiteColor" in2="rimMask" operator="in" result="rimLight" />

                <!-- 2. Inner Glow (Reduced for thinner stroke) -->
                <feMorphology in="SourceAlpha" operator="erode" radius="1" result="deepErode" />
                <feGaussianBlur in="deepErode" stdDeviation="2" result="innerBlur" />
                <feComposite in="SourceAlpha" in2="innerBlur" operator="out" result="innerGlowMask" />
                <feFlood flood-color="white" flood-opacity="0.4" result="glowColor" />
                <feComposite in="glowColor" in2="innerGlowMask" operator="in" result="innerGlow" />

                <!-- 3. Soft Drop Shadow -->
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="shadowBlur" />
                <feOffset dx="0" dy="2" in="shadowBlur" result="shadowOffset" />
                <feFlood flood-color="black" flood-opacity="0.15" result="shadowColor" />
                <feComposite in="shadowColor" in2="shadowOffset" operator="in" result="dropShadow" />

                <!-- 4. Merge Stack -->
                <feMerge>
                    <feMergeNode in="dropShadow" />
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode in="innerGlow" />
                    <feMergeNode in="rimLight" />
                </feMerge>
            </filter>
        </defs>
    `;
};

export const createGlassBorderGradient = (id: string) => {
    return `
        <defs>
            <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="white" stop-opacity="0.9" />
                <stop offset="20%" stop-color="white" stop-opacity="0.2" />
                <stop offset="80%" stop-color="white" stop-opacity="0.2" />
                <stop offset="100%" stop-color="white" stop-opacity="0.9" />
            </linearGradient>
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
    // Editorial Palettes - Sophisticated and print-ready
    economist: {
        name: 'The Economist',
        colors: ['#DC4E41', '#4B9FD5', '#EAC435', '#78B159', '#A885C9']
    },
    ftPink: {
        name: 'FT Pink Editorial',
        colors: ['#CC0066', '#0F5499', '#00757F', '#8B572A', '#593380']
    },
    guardian: {
        name: 'The Guardian',
        colors: ['#052962', '#AB0613', '#FF7F00', '#FECC00', '#197F9F']
    },

    // Modern & Vibrant - Contemporary data viz
    vibrantModern: {
        name: 'Vibrant Modern',
        colors: ['#00D9FF', '#D4FF00', '#00BFA6', '#9C27B0', '#FF6F00']
    },
    neonPop: {
        name: 'Neon Pop',
        colors: ['#FF006E', '#FFBE0B', '#3A86FF', '#8338EC', '#FB5607']
    },

    // Pastel & Soft - Gentle and accessible
    editorialPastel: {
        name: 'Editorial Pastel',
        colors: ['#FF8A80', '#FFB3AD', '#F5E6D3', '#B2DFDB', '#FFCDD2']
    },
    softMints: {
        name: 'Soft Mints',
        colors: ['#B4E7CE', '#F7D1BA', '#E4C1F9', '#A2D2FF', '#FFD6A5']
    },

    // Professional Business - Corporate and trustworthy
    classicBusiness: {
        name: 'Classic Business',
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    },
    corporateBlue: {
        name: 'Corporate Blue',
        colors: ['#1E3A8A', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE']
    },

    // Earthy & Natural - Warm and organic
    earthTones: {
        name: 'Earth Tones',
        colors: ['#D4A574', '#8B7355', '#A0826D', '#C19A6B', '#E6CCB2']
    },
    autumnWarm: {
        name: 'Autumn Warm',
        colors: ['#E07A5F', '#F2CC8F', '#81B29A', '#F4A261', '#E76F51']
    },

    // Bold & Contrasting - Maximum differentiation
    boldPrimary: {
        name: 'Bold Primary',
        colors: ['#FF0000', '#0000FF', '#FFFF00', '#00FF00', '#FF00FF']
    },
    darkContrast: {
        name: 'Dark Contrast',
        colors: ['#FA4D56', '#0F62FE', '#F1C21B', '#24A148', '#D12771']
    },

    // Monochrome Options - Single hue variations
    monochrome: {
        name: 'Monochrome + Accent',
        colors: ['#1a1a1a', '#666666', '#00D9FF', '#999999', '#cccccc']
    },
    blueScale: {
        name: 'Blue Scale',
        colors: ['#002255', '#0044AA', '#0066FF', '#4488FF', '#88AAFF']
    },

    // Accessible Palettes - Color-blind friendly
    accessible: {
        name: 'Accessible (CB-Safe)',
        colors: ['#EE7733', '#0077BB', '#33BBEE', '#EE3377', '#CC3311']
    },
    deuteranopia: {
        name: 'Deuteranopia Safe',
        colors: ['#FFB000', '#648FFF', '#785EF0', '#DC267F', '#FE6100']
    }
};

export type ColorPresetKey = keyof typeof COLOR_PRESETS;

/**
 * Scaled Font Utility
 * Calculates font size based on project base settings
 */
export const getScaledFont = (
    baseSize: number = 11,
    unit: 'pt' | 'px' | 'mm' = 'pt',
    category: keyof typeof CHART_THEME.fontSizes = 'medium',
    isInfographic: boolean = false
) => {
    const scales = {
        tiny: 0.75,
        small: 0.85,
        medium: 1,
        large: 1.25,
        huge: 1.8,
        giant: 2.5,
        extraGiant: 3.5
    };

    // Infographic mode might want everything slightly larger or smaller? 
    // Usually infographics have clear hero numbers.
    let size = baseSize * (scales[category] || 1);

    // If starting scale should be smaller than body text (as per user feedback)
    // Let's apply a 0.9 factor for standard chart labels if they are 'medium'
    if (!isInfographic && (category === 'medium' || category === 'small')) {
        size *= 0.9;
    }

    // Convert to Pixels (standard for SVG/Canvas at 96 DPI)
    // 1pt = 1.333px
    // 1mm = 3.78px
    if (unit === 'pt') return size * 1.333;
    if (unit === 'mm') return size * 3.78;
    return size;
};
