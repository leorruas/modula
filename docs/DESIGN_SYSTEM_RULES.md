
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
