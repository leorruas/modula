import '@testing-library/jest-dom';

// Mock HTMLCanvasElement for text measurement tests
// jsdom doesn't support canvas.getContext(), so we provide a minimal mock
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = function (contextType: string) {
        if (contextType === '2d') {
            const ctx = {
                _font: '16px Arial',
                get font() {
                    return this._font;
                },
                set font(value: string) {
                    this._font = value;
                },
                measureText: function (text: string) {
                    // Parse fontSize from font string (e.g., "bold 14px Arial" or "14px Arial")
                    const fontSizeMatch = this._font.match(/(\d+)px/);
                    const fontSize = fontSizeMatch ? parseInt(fontSizeMatch[1]) : 16;

                    // Check for bold/700 weight
                    const isBold = this._font.includes('bold') || this._font.includes('700');
                    const fontWeight = isBold ? 1.1 : 1.0;

                    return {
                        width: text.length * fontSize * 0.6 * fontWeight,
                        fontBoundingBoxAscent: fontSize * 0.8,
                        fontBoundingBoxDescent: fontSize * 0.2,
                        actualBoundingBoxAscent: fontSize * 0.8,
                        actualBoundingBoxDescent: fontSize * 0.2
                    };
                }
            };
            return ctx as any;
        }
        return null;
    };
}

// Mock document.fonts for font loading tests
if (typeof document !== 'undefined' && !document.fonts) {
    (document as any).fonts = {
        ready: Promise.resolve(),
        addEventListener: () => { },
        removeEventListener: () => { }
    };
}
