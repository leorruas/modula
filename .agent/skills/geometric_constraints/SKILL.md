---
name: Geometric Constraints & Layout Invariants
description: Methodology for designing and verifying layout systems using mathematical constraints to prevent clipping and regressions.
---

# Geometric Constraints & Layout Invariants

A "Smart Layout" is only smart if it respects physical boundaries. This skill defines how to architect layout engines (like `SmartLayoutEngine.ts`) using geometric constraints that remain invariant across all screen sizes and export targets.

## 1. Core Principles

### Principle A: The Golden Equation
For any dimension (Width or Height), the sum of all parts must equal the container size.
`ContainerWidth = MarginLeft + PlotWidth + MarginRight + Inter-elementPadding`.

If you change `MarginRight`, something else MUST change (usually `PlotWidth`). If `MapWidth` becomes smaller than `MIN_PLOT_WIDTH_RATIO`, the engine must trigger a "Reduction Strategy" (wrapping, shrinking, or staggering).

### Principle B: Multi-Pass Execution (Iterative Calculation)
Layouts with dependencies (like labels that wrap based on available width) CANNOT be calculated in a single pass.
- **Pass 1 (Predictive)**: Estimate margins based on raw data.
- **Pass 2 (Geometric)**: Calculate actual available plot area.
- **Pass 3 (Adjustment)**: Re-calculate dependent elements (like wrapping labels) using the exact pixels from Pass 2.

## 2. Defining Invariants in Code

Invariants are rules that must ALWAYS be true. We verify them through Unit Tests.

**Example Invariants:**
1. **Safety Margin**: `marginRight >= MeasuredValueWidth + 30px`.
2. **Plot Integrity**: `plotWidth >= ContainerWidth * 0.4`.
3. **Typography Clipping**: `LabelLines * LineHeight <= ReservedVerticalSpace`.

## 3. Combinations with Other Skills

- **Combination with `testing`**: Unit tests should explicitly verify invariants.
    ```typescript
    it('must maintain geometric balance', () => {
      const layout = engine.compute(...);
      expect(layout.margins.left + layout.zones.plot.width + layout.margins.right).toBe(layout.container.width);
    });
    ```
- **Combination with `vrt`**: Constraints protect the math; VRT protects the "feel".
- **Combination with `task_breakdown`**: Use this skill when the task involves "fixing squashed charts" or "improving responsiveness".

## 4. Workflow Integration

### Planning Phase
- Identify the **Primary Constraint** (e.g., "The label must be legible at 15 chars").
- Define the **Refinement Order** (e.g., "1. Calculate Legend -> 2. Adjust Top Margin -> 3. Fit Plot").

### Verification Phase
- Perform a **Sum-check**: Manually or via code, ensure parts add up to the whole.
- **Stress-check Boundares**: What happens when `ContainerWidth` is only 200px?

## 5. Constraint "Red Flags" Checklist

- **Hardcoded Padding**: Avoid large hardcoded values (e.g., `+ 100`). Use factors of `baseFontSize`.
- **Circular Dependencies**: Pass A depends on Pass B which depends on Pass A. (Always break the loop with a "Measurement-First" pass).
- **Neglecting the Export Buffer**: PDFs often render fonts slightly wider. Constraints must include an `EXPORT_DRIFT_BUFFER` (usually 1.1x).
