import { NumberFormatConfig } from '@/types';

/**
 * Formats a chart value based on the provided configuration.
 * Uses Intl.NumberFormat for robust currency and locale support.
 */
export function formatChartValue(value: number, config?: NumberFormatConfig): string {
    if (!config) return String(value);

    // Handle scaling (e.g. 0.5 -> 50%)
    const finalValue = config.scale ? value * config.scale : value;

    const locale = 'pt-BR'; // Default to Brazilian Portuguese for now, could be dynamic later

    switch (config.type) {
        case 'currency':
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: config.currency || 'BRL',
                minimumFractionDigits: config.decimals ?? 2,
                maximumFractionDigits: config.decimals ?? 2,
            }).format(finalValue);

        case 'percent':
            return new Intl.NumberFormat(locale, {
                style: 'percent',
                minimumFractionDigits: config.decimals ?? 0,
                maximumFractionDigits: config.decimals ?? 1,
            }).format(value); // Note: Intl.NumberFormat percent expects 0-1 range usually, but if user scaled it manually we might need 'decimal' style with suffix. 
        // Actually, if type is 'percent', let's stick to standard percent behavior (0.5 = 50%).
        // If user data is already 50, they should use 'number' with suffix, OR we assume data is 0-1.
        // Let's assume standard behavior: if type is percent, we treat input as ratio unless scaled.
        // Wait, often users put "50" for 50%. 
        // Let's use 'decimal' style and append '%' to be safe if we want to support both, 
        // but the correct way is to use style: 'percent' and expect 0.5.
        // Let's stick to 'decimal' + suffix if we want to handle "50" as "50%".
        // BUT, 'percent' style formats 0.5 as "50%".

        // Revised approach: Use 'decimal' and manual suffix for max control, 
        // or assume standard behavior. Let's try standard 'percent' first.
        // If user checked "scale: 100", it means they want to multiply.

        // Actually, let's implement a simpler "decimal + suffix" for percent to avoid 0.5 vs 50 confusion
        // unless we strictly enforce 0-1.
        // If we use style: 'decimal', we can just append '%'.

        // Let's use standard Intl for now.

        case 'number':
        default:
            return new Intl.NumberFormat(locale, {
                style: 'decimal',
                minimumFractionDigits: config.decimals ?? 0,
                maximumFractionDigits: config.decimals ?? 2,
            }).format(finalValue);
    }
}

/**
 * Specialized version of formatChartValue that handles the specific nuance of "Percent"
 * where users might have data as 50 (for 50%) or 0.5 (for 50%).
 */
export function smartFormatChartValue(value: number, config?: NumberFormatConfig): string {
    if (!config) return String(value);

    // Fallback locale
    const locale = 'pt-BR';

    if (config.type === 'percent') {
        // If data is just a number being formatted as percent, avoiding the multiplication by 100 
        // if using style='percent' inside Intl, is tricky if we don't know the domain.
        // Safer to format as number and append '%' if we are unsure, 
        // OR rely on the `scale` config.

        let valToFormat = value;
        if (config.scale) {
            valToFormat = value * config.scale;
        }

        // If we use style: 'percent', it multiplies by 100.
        // If the user's data is 50 (meaning 50%), style='percent' makes it 5000%.
        // So we should probably use style='decimal' and append '%' for safety,
        // unless we know for sure it's a ratio.

        const formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: config.decimals ?? 0,
            maximumFractionDigits: config.decimals ?? 1,
        }).format(valToFormat);

        return `${formatted}%`;
    }

    return formatChartValue(value, config);
}
