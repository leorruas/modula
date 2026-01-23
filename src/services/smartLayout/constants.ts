/**
 * Constants for Smart Layout System
 * Following System Architecture Rule 5.3: Export Fidelity (Invariants)
 */

// Export Resolution Constants
export const EXPORT_PIXEL_RATIO = 3.5; // High-res PDF export (300 DPI equivalent)
export const EXPORT_SAFETY_PADDING = 40; // Fixed padding for PDF to prevent edge clipping
export const EXPORT_DRIFT_BUFFER = 1.10; // 10% buffer for font rendering differences between screen and PDF

// Font Stack for Export (must match exportUtils.ts)
export const EXPORT_FONT_STACK = '"Inter", -apple-system, sans-serif';

// Grid Constants
export const PIXELS_PER_MM = 3.7795275591; // Standard conversion (96 DPI)

// Layout Constants
export const MIN_PLOT_WIDTH_RATIO = 0.4; // Minimum 40% of width should be plot area
export const LEGIBILITY_FLOOR_PX = 8; // Minimum font size for readability

// Mode Multipliers
export const MODE_MULTIPLIERS = {
    classic: {
        fontSizeMultiplier: 1.0,
        marginMultiplier: 1.0,
        strokeWidthMultiplier: 1.0
    },
    infographic: {
        fontSizeMultiplier: 1.2,
        marginMultiplier: 1.5,
        strokeWidthMultiplier: 1.3
    }
} as const;
