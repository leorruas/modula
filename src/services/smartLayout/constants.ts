/**
 * Constants for Smart Layout System
 * Following System Architecture Rule 5.3: Export Fidelity (Invariants)
 */

// Export Resolution Constants
export const EXPORT_PIXEL_RATIO = 3.5; // High-res PDF export (300 DPI equivalent)
export const EXPORT_SAFETY_PADDING = 40; // Fixed padding for PDF to prevent edge clipping
export const EXPORT_DRIFT_BUFFER = 1.25; // 25% buffer for font rendering differences between screen and PDF

// Font Stack for Export (must match exportUtils.ts)
export const EXPORT_FONT_STACK = '"Inter", -apple-system, sans-serif';

// Grid Constants
export const PIXELS_PER_MM = 3.7795275591; // Standard conversion (96 DPI)

// Layout Constants
export const MIN_PLOT_WIDTH_RATIO = 0.4; // Minimum 40% of width should be plot area
export const LEGIBILITY_FLOOR_PX = 8; // Minimum font size for readability

// Text Measurement Constants
export const TEXT_MEASUREMENT_CACHE_SIZE = 1000; // Maximum cache entries
export const PDF_CALIBRATION_FACTOR = EXPORT_DRIFT_BUFFER; // Alias for clarity (1.10)
export const FONT_LOAD_RETRY_MAX = 3; // Maximum retries for font loading
export const FONT_LOAD_RETRY_DELAY_MS = 100; // Delay between retries

// Legend Constants
export const LEGEND_ICON_SIZE = 8; // Size of legend icon (circle/square)
export const LEGEND_ICON_GAP = 5; // Gap between icon and text
export const LEGEND_ITEM_PADDING = 12; // Horizontal padding between items
export const LEGEND_VERTICAL_GAP = 6; // Vertical gap between rows
export const LEGEND_FONT_SIZE_RATIO = 0.9; // 90% of base font size

// Label Wrapping Constants (FASE 1.3)
export const LABEL_PADDING = 10; // Padding between label and chart edge
export const LABEL_GUTTER = 10; // Gutter between label and plot area
export const LABEL_LINE_HEIGHT_RATIO = 1.2; // 120% line height
export const MAX_LABEL_LINES = 3; // Maximum lines for wrapped labels
export const MIN_LABEL_WRAP_CHARS = 5; // Minimum characters before wrapping

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
