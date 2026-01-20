---
description: Advanced strategies for exporting charts and layouts to PNG and PDF. Focuses on font sanitization, high-fidelity rasterization for complex styles, and multi-page robustness.
---

# Export Skill

> "What you see is what you get... but only if your fonts are sanitized and your gradients are rasterized."

Exporting editorial charts (with glass effects, gradients, and custom web fonts) is notoriously fragile in web environments. This skill documents the **Rasterization Strategy** used to achieve high-fidelity exports across PNG and PDF formats.

---

## 1. The Rasterization Strategy

Instead of attempting to convert complex SVG/CSS directly to PDF vectors (which often fails with gradients, masks, and glass filters), we use a two-step process:

1.  **DOM to Pixels**: Use `html-to-image` to capture the chart container as a high-resolution PNG.
2.  **Pixels to PDF**: Use `jsPDF` to place that PNG onto the document at the exact calculated millimeter coordinates.

| Feature | SVG Vector Export | Raster (PNG) Strategy | Why? |
| :--- | :--- | :--- | :--- |
| **Gradients** | Fragile | **Perfect** | CSS gradients are captured as-is. |
| **Glass Effects** | Often break | **Perfect** | SVG filters are rendered by the browser before capture. |
| **Web Fonts** | Embedding issues | **Sanitization Required** | Browsers render them correctly; capture only needs valid strings. |
| **Performance** | High (memory) | **Balanced** | Pixel ratio 3.5 provides ~300 DPI without crashing mobile. |

---

## 2. Crucial Rule: Font Sanitization

The most common export failure is `can't access property 'trim', font is undefined`. This happens because `html-to-image` attempts to parse and embed fonts from CSS. If it finds complex CSS variables (`var(--font-...)`) that it cannot resolve, it crashes.

### The Fix: Force Standard Fallbacks
Always sanitize the font strings before capture by forcing standard fallbacks in the `fontEmbedCSS` or the `style` object of `html-to-image`.

```typescript
const dataUrl = await htmlToImage.toPng(element, {
    // ...
    fontEmbedCSS: `
        * { font-family: -apple-system, system-ui, sans-serif !important; }
        .data-number { font-family: monospace !important; }
    `,
    style: {
        fontFamily: '-apple-system, sans-serif' // Clamps broken inheritance
    }
});
```

---

## 3. PDF Layout Logic (MM to PX)

PDF coordinates are in **millimeters (mm)**, while the DOM uses **pixels (px)**. Scaling must be dynamic to ensure the export matches the screen layout regardless of the user's screen resolution or zoom level.

### Dynamic Scale Factor Formula
1.  Get the PDF page width in mm: `doc.internal.pageSize.getWidth()`.
2.  Get the DOM container width in px: `containerRef.offsetWidth`.
3.  Calculate `scaleFactor = widthMm / widthPx`.
4.  Apply `scaleFactor` to every `x, y, width, height` from the DOM.

> [!IMPORTANT]
> Use `offsetWidth` and `offsetLeft`, NOT `getBoundingClientRect()`. The latter is affected by CSS transforms (like canvas zoom), which will break your PDF layout.

---

## 4. Robustness & Error Handling

Exporting is expensive and can fail. Never let a single chart failure break the entire document generation.

-   **Data URL Validation**: Check that the generated string is not empty (`length < 100`).
-   **Graceful Degeneracy**: If a chart capture fails, log it and continue to the next one instead of throwing.
-   **Buffer for Rendering**: Give the DOM a tiny rest (e.g., `setTimeout(50)`) before capture to allow React's layout and font loading to settle.

### Diagnostic Logging
Log the calculated coordinates and the result of each step:
```typescript
console.log(`Adding chart ${id} at ${xMm}, ${yMm} (${wMm}x${hMm}mm)`);
```

---

## 5. Performance Optimization

-   **Pixel Ratio**: Use `3.0` to `3.5` for ~300 DPI high-fidelity output. Avoid `6.0+` as it can exceed canvas memory limits on many browsers.
-   **Compression**: When using `doc.addImage`, use `'FAST'` compression for PNGs to balance document size and generation speed.

---

**Remember**: If the PDF is blank, check the console for "font" or "trim" errors first. It's almost always a font parsing issue.
