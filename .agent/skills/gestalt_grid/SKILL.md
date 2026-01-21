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

## 5. Container Intelligence (The "Box" Rule)

Visualizations must respect their bounding box strictly. They should "fill" the container intelligently, maximizing Data Ink without bleeding.

### The "Zero-margin" Philosophy
Do not rely on external CSS margins. Calculate all clearance *inside* the SVG `width/height`.
1.  **Hard Bounds**: `x < 0` or `x > width` is FORBIDDEN.
2.  **Dynamic Padding**: Never use static padding (e.g., `paddingLeft = 40`). Instead, calculate padding based on the *actual* max label width.
    ```typescript
    const maxLabelSpace = Math.min(width * 0.35, maxLabelWidth); // Cap at 35%
    const chartBodyWidth = width - maxLabelSpace - rightPadding;
    ```
3.  **Responsive Text**: If the container is small (`width < 300px`), automatically switch labels to a "Compact Mode" (e.g., hide axis titles, use abbreviations) to preserve space for the graph.

## 6. Proximity & Spacing (The "Breath" Rule)

Use **Proportional Spacing** (EM-based) instead of Fixed Pixels to ensure the chart "breathes" correctly at any size.

### Spacing Constants
Define these relationships relative to the base `fontSize`:

| Relationship | Gap Size | Reasoning |
| :--- | :--- | :--- |
| **Label ↔ Graph** | `0.5em` | Close association (Law of Proximity). |
| **Label ↔ Axis Title** | `1.5em` | Distinct grouping. Title describes the whole axis. |
| **Graph ↔ Legend** | `2.0em` | Major separation. Legend is a global key. |
| **Tick ↔ Tick** | `>= 1.2em` | Prevent clutter. If gaps < 1.2em, trigger **Staggering**. |

### Implementation pattern
Instead of:
```typescript
y={chartHeight + 25} // Bad: Magic number
```
Use:
```typescript
y={chartHeight + (fontSize * 1.5) + axisLabelHeight}
```
This ensures that if the font size increases, the captions don't overlap the labels.
