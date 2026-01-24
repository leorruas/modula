---
name: React Componentization & Composition
description: Guidelines for decomposing monolithic UIs into composable, testable, and maintainable React components using Atomic and Feature-Sliced principles.
---

# React Componentization & Composition Skill

This skill defines the strategy for breaking down complex UIs into clean, reusable parts. It fights "Spaghetti Code" and "God Components" (files > 300 lines).

## When to Use

- **Monolith Refactor**: When a component file exceeds 300 lines (e.g., `BarChart.tsx`).
- **Duplicate Logic**: When you see the same SVG rendering code or math methodology in 3+ files.
- **Complex State**: When `useState` calls exceed 5 per component.
- **Prop Drilling**: When passing props down > 3 levels.

## 1. Composition Patterns

### 1.1 Colocation over Centralization
Don't dump everything in `/components/common`. Prefer keeping sub-components close to where they are used.

```
features/charts/components/BarChart/
├── index.tsx         // Main Entry
├── BarColumn.tsx     // The specific bars
├── AxisX.tsx         // Local axis logic
└── useBarLayout.ts   // Extracted layout logic
```

### 1.2 The Slot Pattern
Avoid boolean flags for rendering content (`renderFooter={true}`). Use `children` or explicit slots.

**Bad:**
```tsx
<Card showFooter={true} footerText="Save" onFooterClick={save} />
```

**Good:**
```tsx
<Card>
  <Card.Body>Content</Card.Body>
  <Card.Footer>
    <Button onClick={save}>Save</Button>
  </Card.Footer>
</Card>
```

---

## 2. Logic Extraction (Hooks)

UI components should focus on **rendering**. Business logic and math belong in **hooks**.

### 2.1 The "Use-Case" Hook
Extract the "thinking" part of the component.

**Before (Monolith):**
```tsx
function BarChart(props) {
  const max = Math.max(...props.data);
  const scale = height / max;
  // ... 50 lines of math ...
  return <svg>...</svg>
}
```

**After (Separation):**
```tsx
function BarChart(props) {
  const { scales, layout } = useBarChartMath(props.data, props.height);
  return <svg>...</svg>
}
```

---

## 3. Style & Theming

### 3.1 Design System Tokens
Never hardcode hex values or magic numbers. Always use the project's design tokens (e.g., `chartTheme.ts`, Tailwind config).

### 3.2 Variance Authority
For components with many visual states (Variant + Size + Intent), use a pattern like `cva` or a clear mapping object.

---

## 4. Discovery & Integration

Before creating a new component, check if it fits the **Atomic Design Hierarchy**:

1.  **Atoms**: Indivisible (Button, Icon, Text). -> *Place in `src/components/ui`*
2.  **Molecules**: Simple groups (SearchField, MenuItem). -> *Place in `src/components`*
3.  **Organisms**: Complex sections (Header, ChartLegend). -> *Place in `src/features/X/components`*
4.  **Templates**: Layout scaffolds.
5.  **Pages**: Connected to routes.

## Skill Integration Matrix

| Preceding Skill | This Skill | Following Skill |
|-----------------|------------|-----------------|
| **System Architecture** <br> (Defines technical boundaries) | **Componentization** <br> (Structures the UI logic & rendering) | **Task Breakdown** <br> (Implements the parts safely) |
| | **Componentization** | **Apply Premium Polish** <br> (Polish atoms individually) |
| **Infography** <br> (Defines visual requirements) | **Componentization** | |

---

## 5. Lessons Learned (Project History)

### 5.1 Smart Engine → Dumb Component Pattern

**Problem**: Components calculated their own margins, wrapping, and positioning.

**Solution**: Created `SmartLayoutEngine` to handle ALL calculations.

**Key Learnings**:
1. **Separation is non-negotiable**: Logic and rendering must be separate
2. **Props should be data, not instructions**: Pass `x={120}` not `calculateX={true}`
3. **Fallbacks indicate incomplete migration**: Should be temporary only

**Mandatory Rules**:
- ALL calculation logic goes in Engine/Hooks
- Components should be <200 lines of pure rendering
- Zero `Math.*` calls in components (except rendering coordinates)

---

## 6. Integration with Other Skills

When componentizing, also reference:

- **system_architecture**: Defines what Engine should calculate
- **task_breakdown**: Phases the componentization work
- **plan_analysis**: Analyzes existing component structure

