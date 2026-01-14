export function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function generateMonochromaticPalette(baseColor: string, steps: number = 5): string[] {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return [baseColor];

    const palette = [];

    // Strategy: Generate tints (lighter) and shades (darker)
    // For simplicity, let's fade to white/transparent or darken.
    // A nice monochromatic scale often goes from Dark to Light.

    // Let's generate from base color towards white for now (Tints)
    // except if base is very light?

    for (let i = 0; i < steps; i++) {
        // Linear interpolation towards white
        // factor 0 = base color
        // factor 1 = white
        const factor = i / (steps); // 0, 0.2, 0.4 ... 

        // We want the base color to be the first or middle?
        // Usually index 0 = strong, index N = light

        const r = Math.round(rgb.r + (255 - rgb.r) * (factor * 0.8)); // Don't go fully white
        const g = Math.round(rgb.g + (255 - rgb.g) * (factor * 0.8));
        const b = Math.round(rgb.b + (255 - rgb.b) * (factor * 0.8));

        palette.push(rgbToHex(r, g, b));
    }

    return palette;
}
