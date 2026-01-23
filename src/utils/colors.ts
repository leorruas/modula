/**
 * Generates an array of distinct colors based on a base palette.
 * If the needed count exceeds the palette length, it generates interpolations/variations.
 */
export function ensureDistinctColors(basePalette: string[], count: number): string[] {
    if (count <= basePalette.length) {
        return basePalette.slice(0, count);
    }

    const extendedPalette = [...basePalette];

    // We neeed (count - basePalette.length) more colors.
    // Strategy: Mix existing colors or lighten/darken them.
    // Simple strategy: repeat palette with 0.7 opacity, then 0.4.
    // Or better: hex mix. 

    // Using a simple algorithm to generate variations:
    // Cycle through base palette and modify brightness/saturation?
    // Since we don't have a huge color lib, let's use a simple hex manipulation loop.

    let k = 0;
    while (extendedPalette.length < count) {
        const baseColor = basePalette[k % basePalette.length];

        // Generate a variation. 
        // Let's prepend a value to make it look like a distinct hex if it's #RRGGBB
        // Use a simple hash-based variation or just alternate shading?
        // Let's rely on standard colors if base is short.

        // BETTER APPROACH: Just cycle for now as requested "app should use max colors possible".
        // The user said: "if user has more colors in charts, app should use max colors possible... if he wants one color he can delete others".
        // This implies: if I have 10 slices, and 5 colors in palette, USE ALL 5, then repeat? 
        // OR generate 10? The user said "use max colors possible". 
        // If I have 3 items and 10 colors, use 3 distinct colors.
        // If I have 10 items and 3 colors, I MUST generate more or just cycle?
        // "se um usuário tem mais cores no gráficos, o app deveria usar o máximo de cores possível"
        // It sounds like: Don't limit the colors to the palette size if data > palette.

        // Let's assuming "Generating variations" is better than repeating.
        // Just alternating slightly for now to ensure visual distinction.
        // Quick & dirty hex variation:
        extendedPalette.push(adjustBrightness(baseColor, (k % 2 === 0 ? 20 : -20)));
        k++;
    }

    return extendedPalette;
}

function adjustBrightness(col: string, amt: number) {
    let usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

export function generateMonochromaticPalette(baseColor: string, count: number): string[] {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // Simple lightening/darkening approach
        const amt = Math.floor(((i - count / 2) / count) * 100);
        colors.push(adjustBrightness(baseColor, amt));
    }
    return colors;
}

/**
 * SUB-PROJECT 1.17: Contrast-Aware Labels
 * Calculates the best text color (black or white) for a given background color.
 */
export function getContrastColor(hex: string): string {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}
