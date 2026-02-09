---
description: how to add a new chart type to Modula
---

To add a new chart type to Modula, follow these steps:

### 1. Define Types
- Update `src/services/smartLayout/types.ts`:
    - Add the new type to the `ChartType` union.
    - Add type-specific position interfaces if needed.
- Update `src/types/index.ts` (if applicable) for global chart definitions.

### 2. Layout Logic
- Create a new rules file in `src/services/smartLayout/rules/` (e.g., `treemapRules.ts`).
- Update `src/services/smartLayout/SmartLayoutEngine.ts`:
    - Implement a `compute[Type]Layout` private method.
    - Add a case in the main `computeLayout` method to route to your new layout function.
    - Ensure it returns the expected `ComputedLayout` with `typeSpecific` data.

### 3. Implement Component
- Create the React component in `src/features/charts/components/` (e.g., `TreemapChart.tsx`).
- Use the `useSmartLayout` hook to access computed geometry.
- Apply `CHART_THEME` for colors, fonts, and spacing.
- Implement **Infographic Mode** features:
    - **Uppercase Labels**: Apply `text.toUpperCase()` to all labels in infographic mode (for both internal and spider-leg labels).
    - **Big Numbers**: Use `getTypographyForValue` logic to scale Hero metrics significantly (up to 4.5x+ boost).
    - **Contrast Awareness**: Mandatory use of `getContrastColor(bgColor)` from `src/utils/colors.ts` for any text rendered inside shapes.
    - **Gradients**: Use unique IDs (like `tg-${chartId}-${i}`) to prevent cross-chart collisions and use intense stop-opacities for visibility.
    - **Glass Finish**: Use `createIOSGlassFilter` and `createGlassGradient` from `chartTheme.ts`.

### 4. Registration
- Register the component in:
    - `src/features/editor/components/ChartItem.tsx` (Primary).
    - `src/features/editor/components/Canvas.tsx` (Render loop).
    - `src/features/editor/components/OffScreenChartRenderer.tsx` (Exports).

### 5. UI Integration
- Update `src/features/editor/components/ChartSidebar.tsx`:
    - Add the new option to the chart type `<select>`.
    - Provide mock data generator for the new type.
- Add specific controls to `src/features/editor/components/InfographicControlsModal.tsx` if needed.
