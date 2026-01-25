# Technical Debt: MixedChart Manual Layout

## Context
As of [Current Date], `MixedChart` implements its own manual layout/stacking logic instead of utilizing the centralized `SmartLayoutEngine`.

## The Debt
-   **Duplication**: Stacking calculation is duplicated between `SmartLayoutEngine` (for BarChart) and `MixedChart` (inline logic).
-   **Inconsistency**: Updates to the core engine (e.g., new label wrapping rules, margin calculations) will NOT automatically apply to `MixedChart`.
-   **Maintenance**: Developers must modify two places for layout changes.

## Resolution Plan
Migrate `MixedChart` to use `SmartLayoutEngine.ts`.
1.  Update `Engine` types to support `mixed` chart input (multiple dataset types).
2.  Implement `computeMixedLayout` in Engine.
3.  Refactor `MixedChart.tsx` to consume `computedLayout` prop.

## Priority
Medium - Should be addressed when "Infographic Mode" features are stabilized.
