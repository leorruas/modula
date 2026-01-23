
# 📏 Gestalt Grid: Design System Rules

Ensuring clarity in high-density data visualization through Gestalt principles.

## 1. Preventive Staggering (The "Air Gap" Rule)
When rendering categorical axes (X-Axis in Histograms, Area Charts), visual collisions are inevitable with dense data. We apply a **Preventive Staggering** logic rather than just truncating text.

### Implementation Pattern
- **Detection**: Calculate `barWidth` or `pointDistance`. If `< 100px`, activate staggering.
- **Alternation**: Odd-indexed labels receive a vertical offset.
- **Dynamic Offset**: The offset is NOT fixed. It is calculated as:
  ```typescript
  const offset = (neighborMaxLines * fontSize * 1.3) + SafetyBuffer;
  ```
  This guarantees that even if a label has 3 lines of wrapped text, the next staggered label will start *below* it.
- **Visual Guides**: Use faint vertical lines (`opacity: 0.2`) to connect the staggered label back to its data point, preserving the law of **Common Fate**.

## 2. Narrative Grids (Legends)
Flexbox legends (`flex-wrap: wrap`) create ragged, hard-to-scan lists when items have varying lengths. We replace them with **CSS Grid**.

### Implementation Pattern
Instead of flex, use:
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
gap: 8px 16px;
```
- **Alignment**: Items visually anchor to columns, creating vertical rhythm.
- **Wrapping**: Legend items allow text wrapping within their cell, rather than overflowing or pushing neighbors erratically.

## 3. The "Hairline" Border
In infographic mode (Donut, Pie), thick borders (2px+) create visual noise and "cartoonishness".
- **Standard Segments**: Use `strokeWidth={0.5}` (Hairline).
- **Hero Segments**: Use `strokeWidth={2}` (Subtle Highlight).
This creates a premium, razor-sharp separation suitable for editorial design.

## 4. Typography Pairing
- **Values (Data)**: Always `Geist Mono`, FontWeight 800 (Black).
- **Labels (Context)**: Always `Geist Sans`, FontWeight 600, `uppercase`, `letterSpacing: 0.05em`.
This contrast helps the user instantly distinguish *what* (category) from *how much* (value).

## 5. Ink-to-Space Ratio (Density Orchestration)
To prevent visual saturation, the system monitors the "Data Ink" density.
- **Dynamic Decluttering**: If the area occupied by bars/lines exceeds 80% of the plot area, secondary axes and secondary grid lines are automatically hidden.
- **Breathing Room**: A mandatory 12px safety gap is maintained between any data label and a chart boundary.

## 6. Level of Detail (LOD)
Charts must degrade gracefully. The system switches between contexts based on pixel density:
- **Full**: (> 600px wide) All annotations, secondary axes, and full legends.
- **Normal**: (300px - 600px) Smart labels, compact legends.
- **Compact**: (150px - 300px) Hero values only, no secondary axes.
- **Iconographic**: (< 150px) No text or axes; only the data silhouette (Sparkline).

## 7. Contrast-Aware Accessibility (Legibility First)
When labels move *inside* colored elements (e.g., labels inside bars in Sub-Project 1.16/1.17):
- **Luminance Checker**: The system calculates the perceived brightness of the background color.
- **Dynamic Color Swap**:
    - `Luminance > 0.5` (Light background) -> Text becomes **Black**.
    - `Luminance <= 0.5` (Dark background) -> Text becomes **White**.
This ensures 100% legibility regardless of the palette used.
