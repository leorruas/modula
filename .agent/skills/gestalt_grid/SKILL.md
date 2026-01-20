---
description: A set of principles and patterns for creating high-density, editorial infographic layouts.
---

# Gestalt Grid: Design System Rules

This skill provides guidelines for implementing clarity in high-density data visualizations using Gestalt principles. It focuses on resolving visual conflicts and establishing strong narrative hierarchies.

## 1. Preventive Staggering (The "Air Gap" Rule)

When rendering categorical axes (X-Axis in Histograms, Area Charts), visual collisions are inevitable with dense data. Apply **Preventive Staggering** logic rather than just truncating text.

### Implementation Pattern
1.  **Detection**: Calculate `barWidth` or `pointDistance`. If `< 100px`, activate staggering.
2.  **Alternation**: Odd-indexed labels receive a vertical offset.
3.  **Dynamic Offset**: The offset is NOT fixed. Calculate it based on the neighbor's text block height:
    ```typescript
    const offset = (neighborMaxLines * fontSize * 1.3) + SafetyBuffer;
    ```
    This guarantees that even if a label has 3 lines of wrapped text, the next staggered label will start *below* it.
4.  **Visual Guides**: Use faint vertical lines (`opacity: 0.2`) to connect the staggered label back to its data point (Law of Common Fate).

## 2. Narrative Grids (Legends)

Avoid `flex-wrap` legends which create ragged, hard-to-scan lists. Use **CSS Grid** for structured alignment.

### Implementation Pattern
Use the following CSS Grid structure for legend containers:
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
gap: 8px 16px;
```
-   **Alignment**: Items visually anchor to columns, creating vertical rhythm.
-   **Wrapping**: Legend items allow text wrapping within their cell.

## 3. The "Hairline" Border

In infographic modes (Pie, Donut), avoid thick borders that look "cartoonish".

-   **Standard Segments**: Use `strokeWidth={0.5}` (Hairline).
-   **Hero Segments**: Use `strokeWidth={2}` (Subtle Highlight).

## 4. Typography Pairing (Editorial Standard)

-   **Values (Data)**: `Geist Mono` / `FontWeight 800 (Black)`
-   **Labels (Context)**: `Geist Sans` / `FontWeight 600` / `uppercase` / `letterSpacing: 0.05em`

This specific contrast is critical for separating *quantitative* data from *categorical* context.
