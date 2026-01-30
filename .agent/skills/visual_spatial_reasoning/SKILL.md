---
name: Visual Spatial Reasoning
description: Methodology for calculating, verifying, and optimizing layout geometry and spatial occupancy in visual systems to prevent collisions, clipping, and inefficient space usage.
---

# Visual Spatial Reasoning Skill

## Purpose

To provide a rigorous algorithmic framework for managing visual space in complex layouts (charts, maps, dashboards). It ensures that "The System Knows Exactly What It Occupies" and "The System Knows Exactly Where It Fits".

## Core Principles

### 1. **Coordinate System Invariants**
> "Origin is Truth"

- **Define the Zero**: Always explicitly document the `(0,0)` origin of your layout data (e.g., Top-Left vs. Center-Relative).
- **No Double-Offset**: Avoid rendering absolute coordinates inside translated groups.
- **Rule**: If a component uses a centered `<g>`, the Engine must return coordinates relative to `(0,0,0)` (the center).

### 2. **Explicit Bounding Box Analysis**
> "Measure twice, place once"

- **Effective Occupancy**: Calculate the `BBox` (Bounding Box) of every element *before* placing it.
- **Content-Aware Margins**: Margins should be the result of `Max(Label_End_Pos) - Container_Edge`, not a fixed constant.

### 3. **The "Microbiologist" Audit**
> "Zoom in on the edges"

- **Clipping Detection**: (Position + Width) > Container_Width = CLIP.
- **Buffer Zones**: Maintain a "Safe Zone" (e.g., 20px) where no text should ever enter.
- **Responsive Recovery**: If clipping occurs, recursively trigger:
    1. Shrink Chart (increase margins).
    2. Wrap Text (reduce width).
    3. Truncate (emergency measure).
    4. Hide (last resort).

### 4. **Anchor Intelligence**
> "Start, Center, End"

- **Distance-Based Choice**:
    - Near Left Edge? -> `text-anchor: start`
    - Near Right Edge? -> `text-anchor: end`
    - Near Center? -> `text-anchor: middle`
- **Avoid "Growth Into Wall"**: Never use `anchor: start` for elements on the far right of the layout.

## Workflow

### Phase 1: Spatial Intake
1. Identify all visual elements (Nodes, Labels, Legends).
2. Gather detailed metrics (Width, Height, Line Count).

### Phase 2: Virtual Placement
1. Place elements at "Ideal" coordinates.
2. Calculate the "Total Visual Footprint" (MinX, MaxX, MinY, MaxY).

### Phase 3: Boundary Reconciliation
1. Compare Footprint against `Container_Bounds`.
2. Apply `Asymmetric Growth` or `Asymmetric Shrinkage` to balance the occupancy.

### Phase 4: Verification (VRT)
1. Use a "Debug Overlay" to show the calculated BBoxes vs. actual rendering.
2. Stress test with extreme values (Longest possible label, Smallest possible container).

## Example: Radial Chart Collision Fix

```typescript
// BAD: Assuming legend fits
x = width - margins.right; 
textAnchor = 'start'; // Grows RIGHT (into the wall)

// GOOD: Spatial reasoning
const availableSpace = width - currentX;
if (labelWidth > availableSpace) {
    textAnchor = 'end'; // Grow LEFT (towards center)
    x = width - margin_safe;
}
```
