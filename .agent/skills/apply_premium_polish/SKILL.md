---
description: A rigid checklist and guide to enforcing "Premium Aesthetics" (App UI) and "Print Perfection" (Output).
---

# Apply Premium Polish Skill

This skill is the "Art Director" of the agent. It separates the "Tool" (The App) from the "Product" (The Printed Chart).

## 1. The App UI: "Modern & Alive"
*Guidance for Modals, Sidebars, Inputs, and Menus.*

- [ ] **Glassmorphism**: No flat backgrounds. Use `backdrop-blur-md`, subtle borders `border-white/10`, and deep shadows.
- [ ] **Interaction**:
    - **Hover**: Scale (1.02) or Brightness.
    - **Active**: Scale down (0.98).
    - **Transition**: Always `duration-300 ease-out`.
- [ ] **Typography**: Follow the [Typography Skill](../typography/SKILL.md). Use tracking (`tracking-tight` on headings) and hierarchy.

## 2. The Chart Output: "Print Perfection"
*Guidance for the SVGs/Canvas inside the Grid.*

**The Golden Rule**: If it looks good on screen but blurs on print, it is BROKEN.

### Vector Fidelity
- [ ] **No Raster Filters**: CSS filters like `backdrop-filter` or `box-shadow` often fail in PDF generation (html2canvas/jsPDF).
    - *Fix*: Use SVG `<filter>` definitions if shadow is strictly necessary, or avoid entirely for a clean vector look.
- [ ] **High DPI Mental Model**:
    - The output might be printed on A3 paper. A 1px border might disappear.
    - *Fix*: Use robust stroke widths (min 1.5px for visible lines).

### Cleanliness > Effects
- [ ] **Zero Animation**: The chart must be static. No "growing bars". It must look perfect at frame 0.
- [ ] **Contrast**: Ensure colors are distinct for CMYK (avoid neon colors that don't print well unless intended).
- [ ] **Legibility**: Labels must be large enough to read when the page is scaled down (A3 -> A4).

### The "Paper Test"
Imagine this chart printed on a magazine page.
- [ ] Is the font weight too light? (Avoid `font-thin`).
- [ ] Is the spacing too tight? (Ink bleeds).
- [ ] Is the background strictly white or transparent? (No gray app backgrounds in the export).

## 3. Example of Conflicts

| Feature | **App UI (Sidebar)** | **Print Output (Chart)** |
| :--- | :--- | :--- |
| **Shadow** | `shadow-lg` (CSS) | SVG `<feDropShadow>` or None |
| **Blur** | `backdrop-blur` (Glass) | **FORBIDDEN** (Rasterizes) |
| **Animation** | `transition-all` | **FORBIDDEN** (Static) |
| **Borders** | `border-white/10` | Solid `strike` colors |

## Critical Check
When working on a Chart Component, ask: **"Will this break `html2canvas`?"**
If the answer is "maybe", find a vector-safe alternative.
