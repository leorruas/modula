# Implementation Plan: Smart Layout System

> **Goal**: Replace ad-hoc variable calculations spread across components with a centralized `SmartLayoutEngine` that ensures optimal layout for both screen and PDF export.

## User Review Required
> [!IMPORTANT]
> This is a massive refactor ("Epic"). We will proceed in **Sub-Projects**, starting with a **Tracer Bullet** (BarChart) to prove the architecture before rolling out to all 16+ chart types.

---

## Sub-Project 1: Foundation & Tracer Bullet (BarChart)

**Objective**: Establish the engine structure and prove visibility with one chart type (`BarChart`).

### Phase 1: Structure (The Skeleton)
Create the file structure and type definitions. No logic yet.

#### [NEW] [types.ts](file:///Users/leoruas/Desktop/modula/src/services/smartLayout/types.ts)
- Define `ChartAnalysis`, `ComputedLayout`, `LayoutRules`, `GridConfig`.
- Define `Zone` interface.

#### [NEW] [SmartLayoutEngine.ts](file:///Users/leoruas/Desktop/modula/src/services/smartLayout/SmartLayoutEngine.ts)
- Create class/module structure.
- Export empty `analyzeChart` and `computeLayout`.

### Phase 2: Logic (The Brain)
Implement the core algorithms for layout computation, focused on `BarChart`.

#### [MODIFY] [SmartLayoutEngine.ts](file:///Users/leoruas/Desktop/modula/src/services/smartLayout/SmartLayoutEngine.ts)
- Implement `analyzeChart`: Extract complexity (label lengths, categories).
- Implement `computeDynamicMargins`: Calculate margins based on rules.
- Implement `computeLayout`: Orchestrate zones (Legend, Plot, Axes).

#### [NEW] [barRules.ts](file:///Users/leoruas/Desktop/modula/src/services/smartLayout/rules/barRules.ts)
- Define layout priorities for Bar Charts (preference for width, bottom legend).

### Phase 3: Wiring (The Integration)
Connect the engine to the React components.

#### [NEW] [useSmartLayout.ts](file:///Users/leoruas/Desktop/modula/src/hooks/useSmartLayout.ts)
- Hook that wraps `SmartLayoutEngine.computeLayout`.

#### [MODIFY] [BarChart.tsx](file:///Users/leoruas/Desktop/modula/src/features/charts/components/BarChart.tsx)
- Accept `computedLayout` prop.
- **CONDITION**: If `computedLayout` is present, use its margins/sizes. If not, fall back to legacy logic (Safe Rollout).

### Phase 4: Verification (The Test)
#### 🔍 How to Verify (User Action)
1.  **Run the App**: `npm run dev`
2.  **Open Editor**: Go to any dashboard and add a **Bar Chart**.
3.  **Test Stress Case**:
    - Edit data and add a very long category name (e.g., "This is a very long category name that should push the margin").
    - **Expected Result**: The chart plot area should shrink, and the left margin should grow to accommodate the text. Text **must not** be cut off.
    - **Visual Check**: Toggle between `Classic` and `Infographic` mode. Margins should noticeably change (Infographic has more breathing room).

---

## Sub-Project 1.1: Foundation Corrections (Smart Layout v1.1) [checked]
**Goal**: Fix critical flaws identified during Phase 3 verification (Label overflow, Layout constraints ignored, PDF inconsistency).

#### [NEW] [TextMeasurementService.ts](src/services/smartLayout/TextMeasurementService.ts)
- Implement offscreen canvas measurement.
- Cache results for performance.
- Handle font loading states.

#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- Replace scalar estimate with `measureText`.
- Prioritize user preferences (e.g., Legend Position) over rules.
- Add `exportBuffer` logic for standard deviation between Browser/PDF.
- Add `assessOverflowRisk` logic.

#### [MODIFY] [pdfExportService.ts](src/services/pdfExportService.ts)
- Pass specific `exportContext` to engine to trigger safe-mode layout.

#### 🔍 How to Verify (User Action)
1.  **Text Measurement**:
    - Add a chart with a mix of wide ("MMMM") and narrow ("iiii") labels.
    - **Check**: Margins should adapt tightly to the actual pixel width, not just character count.
2.  **User Override**:
    - Set BarChart legend to `Right`.
    - **Check**: Engine must respect this and reserve space on the right, ignoring the "Bottom" rule.
3.  **PDF Safety**:
    - Export the chart.
    - **Check**: Even if the font renders slightly differently in PDF, the `exportBuffer` should prevent any text clipping.

---

## Sub-Project 1.2: Visual Polish (The Big Fix) [checked]
**Goal**: Address visual regressions (Casos 1-6) from the regression log. Fix vertical collapse, spacing inefficiencies, and annotation rendering.

### Phase 1: Engine Architecture Upgrade
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- Implement `Vertical Fill Strategy`: Calculate `barThickness` dynamically to fill `plotHeight`.
- Detect `Grouped Header` mode: Zero out left margin if labels are on top.
- Add `Annotation Reserves`: Calculate extra margin for badges (Hero/Min/Max).
- Add `Grid Safety`: Generate `clipPath` parameters to contain overflowing lines.

### Phase 2: Component Wiring
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- Use `computedLayout.typeSpecific.barThickness`.
- Apply `clipPath` from metadata.
- Render `Annotation Badges` (Hero/Min/Max) using calculated zone coordinates.
- Remove internal `height` constraints that cause collapse.

#### 🔍 How to Verify (User Action)
1.  **Vertical Fill**: Chart should stretch to bottom of blue container (no white gap).
2.  **Grouped Header**: Left margin should be minimal when labels are on top.
3.  **Badges**: "Maximum" and "Minimum" should appear clearly and not float over other elements.

---

## Sub-Project 1.3: Scale Safety (The Limit) [checked]
**Goal**: Prevent "Scale Explosion" (Regression Case 7) where low-density charts (few categories) rendering in high-height containers result in absurdly large columns and fonts.

### Phase 1: Engine Constraints
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- Implement `Bar Thickness Cap`: Enforce a hard maximum (e.g. 60-80px) regardless of available space.
- Implement `Fill Factor Limit`: Even in "Vertical Fill" mode, do not fill 100% if it means violating density norms.

### Phase 2: Component Guardrails
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- Enforce `maxBarHeight` in the layout loop.
- Decouple `fontSize` from `barHeight` when `barHeight` exceeds a certain threshold (prevent semantic scaling from becoming comedic).

#### 🔍 How to Verify (User Action)
1.  **Low Density Test**: Create a chart with only 2-3 categories but give it a large height (e.g. 600px).
2.  **Expected**: Bars should be reasonably sized (max 80px thick), centered in their slots, with plenty of white space. Fonts should remain readable, not gigantic.

---

## Sub-Project 1.4: Responsive Density (Redemption) [checked]
**Goal**: Fix the "Thin Bar" and "Margin Collapse" regressions by implementing a true Responsive Density system. Revert unsafe optimizations (Zero Margin) until rendering support is confirmed.

### Phase 1: Engine Integrity (The Brain)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Constraint Fix**: Ensure `barThickness` calculation does not fall through to the 4px minimum. Debug `chartType` check.
- **Margin Logic**: Revert `marginLeft = 0` for Infographic mode. Instead, use `marginLeft = computed` but allow the Component to override if it *actually* renders headers.
- **Density Factor**: Calculate `density = categoryCount / plotHeight`. Adjust caps based on density (High Density = Thinner Caps, Low Density = Thicker Caps).

### Phase 2: Component Alignment (The Body)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- Use `computedLayout` margins strictly (don't mix and match with legacy padding).
- Fix `datasetCount` divider logic (Grouped vs Stacked).

#### 🔍 How to Verify (User Action)
- **Classic**: Bars should be responsive (thick) and margins should accommodate labels.
- **Infographic**: Bars should be responsive (thick) and labels should have dedicated space (standard left axis for now).

---

## Sub-Project 1.5: Label Alignment & Value Safety (Smart Evaluation) [checked]
**Goal**: Replace hardcoded offsets with a data-driven "Smart Evaluation" engine. Fix "Ghost Labels" and "Value Clipping" by measuring actual content (numbers + labels) before layout.

### Phase 1: Content Measurement (The Eyes)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Value Measurement**: Measure the pixel width of the `maxValue` and its corresponding string representation (e.g., "1,200").
- **Badge Analysis**: Estimate the width needed for Badges ("MAX", "MIN") using `TextMeasurementService`.
- **Metadata**: Add results to `ChartAnalysis.dataComplexity`.

### Phase 2: Dynamic Buffering (The Logic)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **MarginRight Solver**: Instead of `baseFontSize * 5`, use `max(measuredValueWidth + measuredBadgeWidth + 15, baseReserve)`.
- **Label Mapping**: Return `typeSpecific.categoryLabelX` and `typeSpecific.categoryLabelAnchor` in `ComputedLayout`.
  - If `infographic` & `bar`, set `x = -16`, `anchor = "end"`.
  - If `classic`, keep standard axis logic.

### Phase 3: Dumb Component Rendering (The Body)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- Remove `x={-16}` hardcoding.
- Consume `computedLayout.typeSpecific.categoryLabelX` and `anchor`.

#### 🔍 How to Verify (User Action)
- Labels should still be on the left gutter.
- Right margins should shrink/grow based on the actual size of the "95" or any other value on the right.
- Ensure "95" is never cropped regardless of font scale.

---

## Sub-Project 1.6: Optical Balance & Legend Intelligence [checked]
**Goal**: Refine the visual rhythm between labels, bars, and legends using typographic and architectural safeguards.

### Phase 1: Optical Gutter (Typography)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Gutter Logic**: Calculate a `labelPadding` based on `baseFontSize` (e.g., `0.8 * fontSize`).
- **Engine-Driven instruction**: Pass `categoryLabelX: -(labelPadding)` to the component.
- **Classic Guard**: Ensure `categoryLabelX` is `0` and `anchor` is `"start"` if the chart needs categorical labels *inside* the plot (stacked) OR correctly offset for side-labels.

### Phase 2: Universal Legend Intelligence (System Architecture)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Universal Legend Solver**: Refactor `margin` logic to estimate legend size for all positions:
  - **Left/Right**: Estimate width based on dataset count and label length. If few datasets, shrink the margin.
  - **Top/Bottom**: Estimate height based on wrap-around logic. If 1-2 items, use minimal reserve (20-30px).
- **Dynamic Breathing**: Use `Typography` skills to set `categoryLabelSpacing` based on `baseFontSize` (e.g. `1.0 * fontSize` gap for Infographic).

### Phase 3: Classic Mode Restoration
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- **Classic Guard**: Ensure `isStackedLayout` logic doesn't force Classic labels below the bar if they fit on the side.
- **Stateless Anchoring**: Use the Engine's `categoryLabelAnchor` and `categoryLabelX` consistently across all modes.

#### 🔍 How to Verify (User Action)
- Check Classic mode: Labels should be in their original side position.
- Check Infographic mode: Labels should have a breathable distance from the bars.
- Observe chart height: It should utilize vertical space better when the legend is small.

---

## Sub-Project 1.7: Optical Maturity & Export Fidelity [checked]
**Goal**: Fine-tune the visual rhythm and ensure 1:1 fidelity in PDF exports.

### Phase 1: Smart Gutter & Legend Squeeze (Engine)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Tighter Rhythms**: Reduce `categoryLabelX` from `-24` to `-18` (or an intelligent factor of `fontSize`) for Infographic mode.
- **Aggressive Legend Reclaim**: In `computeDynamicMargins`, ensure `marginTop/Bottom` reserves are strictly bounded by the actual legend content, allowing the `plotZone` to expand closer to the legend.
- **Top Value Mapping**: Add `valuePositioning: 'top'` to `typeSpecific` for Infographic mode.

### Phase 2: Content Re-orchestration (Component)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- **Vertical Value Labels**: If `valuePositioning === 'top'`, render value labels and badges *above* the bar instead of to the right.
- **Optical Tuning**: Ensure the gap between label and bar feels premium and standardized.

### Phase 3: PDF Fidelity Investigation
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Fidelity Check**: Ensure `target === 'pdf'` doesn't squash the chart by enforcing an `idealAspectRatio` or minimum height that respects the PDF multi-column layout.
- **Font Mapping**: Ensure Infographic fonts (Narrative/Data) are correctly passed and mapped for the PDF generator.

#### 🔍 How to Verify (User Action)
- Labels should be closer to the bars (tight but breathable).
- Charts should look taller/bigger when legends are small.
- Values should appear above the bars in Infographic mode.
- Export to PDF: The chart should not look "achatado" (squashed) and must use the correct font families.

---

## Sub-Project 1.8: Smart Label Wrapping (Architectural Orchestration) [checked]
**Goal**: Transition label wrapping from "guessing" to Engine-calculated boundaries.

### Phase 1: Wrapped Intelligence (Engine)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Threshold Calculation**: Calculate `labelWidthThresholdPx` based on the final reserved `marginLeft`.
- **Instruction Mapping**: Pass `labelWrapThreshold` (in approximate characters) via `typeSpecific` to the component.
- **Height Awareness**: Adjust `estimatedLines` logic to be more scientific: `labelLength / threshold` instead of hardcoded `18`.

### Phase 2: Predictive Rendering (Component)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- **Stateless Wrapping**: Remove the `width / charWidth` guess. Use the Engine's `labelWrapThreshold`.
- **Optical Overflow**: Ensure that even if a label is forced to wrap more than 3 lines, it doesn't overlap the bar (use clipping or smarter line-clamping).

#### 🔍 How to Verify (User Action)
- Change window size: Labels should wrap exactly when they touch the "gutter" boundary.
- Long labels should occupy more vertical space (Engine should have reserved it).

---

## Sub-Project 1.10: Predictive Layout & Editorial Scaling [checked]
**Goal**: Reserve vertical space based on *actual* wrapped line counts and restore premium infographic value impact.

### Phase 1: Simulated Wrap Budget (Engine)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Simulated Measurement**: In `computeDynamicMargins`, simulate semantic wrapping for the longest labels.
- **Vertical Reserve**: Adjust `marginBottom` and row heights based on the simulated line counts.

### Phase 2: High-Impact Editorial Scaling (Component)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- **Restored Scaling**: Restore and enhance proportional scaling for infographic values (`fontSize * 2.5 * ratio`).
- **Gutter Stability**: Ensure a 12px safety gap persists even with extreme scaling.

---

## Sub-Project 1.11: Advanced Font Metrics & Constraint Solver [checked]
**Goal**: Transition from simple width measurement to full bounding-box collision detection between labels.

---

## Sub-Project 1.12: Design Debug Mode (Transparency) [checked]
**Goal**: Visual transparency of Engine decisions to verify measurement accuracy.
- **Debug Overlays**: Render semi-transparent boxes for margins (red), plot (green), and gutter (blue).

---

## Sub-Project 1.13: Predictive Fail-Safe (Level of Detail - LOD) [checked]
**Goal**: Resilient layouts that degrade gracefully instead of breaking.
- **Ratio de Ilegibilidade**: Switch between Full, Compact, and Iconographic modes based on pixel density.

---

## Sub-Project 1.14: Optical Margin Alignment [checked]
**Goal**: Fine-tune alignment for character shapes (e.g., "o" vs "H") to achieve "Haute Couture" design.

---

## Sub-Project 1.15: Font Synchronization (Handshake) [checked]
**Goal**: Eliminate measurement drift caused by unloaded web fonts.
- **fontsReady event**: Hook into `document.fonts.ready` before finalizing Engine results.

---

## Architectural Alignment (System Design Skill) [checked]
*Mapping the following "Elite" features to `SKILL.md` principles:*

- **Constraint Orchestration (Section 5.2)**: `1.16 Anchor Point` and `1.19 Semantic Grouping` replace hardcoded logic with dynamic collision rules.
- **Safety Nets (Section 3.2)**: `1.17 Contrast-Aware` protects against invalid user inputs (color legibility).
- **LOD & Completeness (Section 3.2)**: `1.18 Ink-to-Space` implements graceful degradation for density.
- **Environment Gap (Section 2)**: `1.20 Golden Ratio` solves the "container inconsistency" gap.
- **Measurement-First (Section 5.1)**: `1.44 Legend Simulation` replaces heuristic guessing with pixel-perfect flex math.

*Phase 3 Extensions (Deep Robustness)*
- **Safety Nets (Section 3.2)**: `1.21 Self-Healing` (Retry Loop) ensures no broken graphs reach the user.
- **Constraint Orchestration (Section 5.2)**: `1.23 Force-Directed`, `1.26 Intelligent Axis`, and `1.27 Compact Legend` implement the "Anti-Wrapping" hierarchy.
- **State Consistency (Robustness)**: `1.28 Smart Color` and `1.30 Dual-Axis` enforce invariants across renders.
- **Editorial Intelligence (Advanced Analytics)**: `1.22 Narrative Axis`, `1.24 Inline Titles`, `1.25 Semantic Units`, and `1.29 Outliers` automate data journalism best practices.

*Phase 4 Extensions (Super-Human Intelligence)*
- **Crowd Control (Advanced Analytics)**: `1.31 Dynamic Time Aggregation` prevent scribble-charts.
- **Gestalt Spacing (Gestalt Grid)**: `1.32 Goal-Aware` and `1.36 Grid Elasticity` ensure "Visual Breathing" and correct anchoring.
- **Editorial Pre-Processing**: `1.33 Smart Sorting` and `1.35 Semantic Values` apply senior editor rules before rendering.
- **Performance UX (System Architecture)**: `1.34 Skeleton Layout` eliminates CLS.
- **Data Integrity**: `1.38 Anchor-to-Zero` prevents misleading scales.
- **Direct Labeling (Infography)**: `1.37 Radial Anti-Collision` and `1.40 Margin Notes` move the story out of tooltips and onto the canvas.
- **Container Intelligence (Gestalt Grid)**: `1.41 Vertical Flow` and `1.36 Grid Elasticity` ensure the chart physically adopts the container's shape.
- **Editorial Density (Advanced Analytics)**: `1.42 Thickness Intelligence` adapts the "Ink Weight" based on available white space.

---

## Sub-Project 1.16: Anchor Point Evolution (Smart Anchoring) [checked]
**Goal**: Dynamically decide if value labels sit *inside* or *outside* the bar to maximize plot usage.
- **Logic**: If `barWidth > labelWidth + 20px` (20% cushion), place Inside. Else, place Outside.
- **Engine Output**: `valuePositioning: 'inside' | 'outside'` per datum.
- **Impact**: Cleaner high-density dashboards.

---

## Sub-Project 1.17: Contrast-Aware Labels (Accessibility) [checked]
**Goal**: Guarantee legibility when labels move inside colored bars.
- **Logic**: Calculate luminance of bar color. If `luminance > 0.5`, text = Black. Else, text = White.
- **Implementation**: New utility `getContrastColor(hex)` in `colors.ts`.
- **Impact**: Zero-config accessibility compliance.

---

## Sub-Project 1.18: Ink-to-Space Ratio (Density Orchestration) [checked]
**Goal**: Automatically reduce chart noise (grids, axes) when data density is high.
- **Logic**: Calculate "Ink Ratio" (Area of Bars / Area of Plot).
- **Threshold**: If Ink > 80%, hide secondary axes and grid lines.
- **Impact**: Prevents "Data Ink" saturation; lets the data breathe.

---



## Sub-Project 1.20: Golden Ratio Aspect Scaling [checked]
**Goal**: Enforce aesthetically pleasing proportions for the data shape, regardless of container size.
- **Logic**: Adjust internal padding to push the "Data Rectangle" towards `1.618` (Golden) or `1.33` (4:3).
- **Impact**: Charts always look "well-composed" even if the user drags a weirdly shaped grid module.
---

## Sub-Project 1.21: Self-Healing Layouts (The Retry Loop) [checked]
**Goal**: Prevent "broken" layouts by allowing the Engine to self-correct before rendering.
- **Logic**: Implement a `validateLayout()` pass. If `riskScore > threshold` (e.g., collision detected), the Engine triggers a re-calculation with safer parameters (e.g., `compactMode: true`, `hideAxis: true`).
- **Standard**: Follows **System Architecture (Robustness Checklist)**: "Constraint Solving: What happens when items collide?".
- **Impact**: User never sees a broken graph, only a simplified one.

---



## Sub-Project 1.23: Smart Collision Avoidance (Force-Directed Labels) [checked]
**Goal**: Solve label overlap in Scatter/Bubble charts using physics.
- **Logic**: Treat labels as physical bodies with repulsion. Run a micro-simulation (5-10 iterations) to push them into empty whitespace.
- **Fallback**: If equilibrium isn't reached, draw a "Connector Line" to the data point.
- **Standard**: Follows **Gestalt Grid**: "Preventive Staggering" principle extended to 2D space.
- **Impact**: Readable high-density plots without manual adjustment.

---

## Sub-Project 1.24: Inline Axis Titles (Space Saver) [checked]
**Goal**: Eliminate wasted margin space by integrating axis titles directly into the chart area.
- **Logic**:
  - **Y-Axis**: Move title from rotated left position to the **top of the Y-axis**, aligned with the Max Value or grid top.
  - **X-Axis**: Move title to the **end of the axis** (right aligned) or inline with the last tick.
- **Standard**: Follows **Infography**: "Delete the Ink" (Standard charts waste space; Infographics integrate text).
- **Impact**: Recovers ~40px of width for the actual data.

## Sub-Project 1.25: Semantic Unit Extraction [checked]
**Goal**: Clean up repetitive noise in tick labels (e.g., "$10, $20, $30").
- **Logic**: Scan ticks. If >80% contain the same non-numeric symbol ($, %, kg), strip it from the ticks and append it to the Axis Title (e.g., "Revenue ($)").
- **Standard**: Follows **Advanced Analytics**: "Context is King" (Show context once, not 10 times).
- **Impact**: cleaner, easier-to-scan numbers (Geist Mono).

## Sub-Project 1.26: Intelligent Category Axis (Zero Truncation) [checked]
**Goal**: Solve label overlap WITHOUT ever cutting the text.
- **Problem**: Long names wrapping ugly or colliding.
- **Logic**:
  1. **Measure**: Calculate space per category.
  2. **Orchestrate (No-Truncate Policy)**:
     - **Standard**: Allow 3-line wrap if space permits.
     - **Stagger (Alternation)**: If density is high, alternate labels (Top/Bottom or Left/Right offset).
     - **Rotation (Last Resort)**: If staggering fails, rotate 45 degrees (better than cutting text).
- **Standard**: Follows **User Rule**: "No Truncation".
- **Impact**: Full data fidelity always.

## Sub-Project 1.27: Compact Legend Grid [checked]
**Goal**: Optimize legend efficiency to free up plot height.
- **Problem**: Legends currently use fixed-width, creating huge white gaps (see image).
- **Logic**:
  - **Flex-Wrap -> CSS Grid**: Switch from Flexbox to a dense CSS Grid layout.
  - **Dynamic Gutter**: Calculate the *exact* width of each legend item + 16px gap.
  - **Compact Rows**: If items are short (e.g., years "2023", "2024"), pack 4-5 per row instead of 2.
- **Standard**: Follows **Gestalt Grid**: "Narrative Grids".
- **Impact**: Reduces legend height by ~50%, giving more room to the chart.

## Sub-Project 1.28: Smart Color Assignment (Semantic Consistency)
**Goal**: Ensure "Revenue" is always Blue, even if the data order changes.
- **Problem**: Colors shifting randomly confuses the user.
- **Logic**: Use a deterministic hash of the Series Name to pick a color from the palette, OR maintain a `colorMap` across re-renders.
- **Standard**: Follows **System Architecture**: "Robustness" (State consistency).
- **Impact**: Automatic visual coherence across the dashboard.

## Sub-Project 1.29: Automatic Outlier Highlighting (Focus)
**Goal**: Tell the story of the "Anomaly" without manual config.
- **Logic**: Calculate Z-Score. If `score > 2.0` (2 standard deviations):
  - **Hero**: Opacity 1.0, Bold Label.
  - **Context**: Opacity 0.6.
- **Standard**: Follows **Advanced Analytics**: "Editorial Intelligence" (Highlight what matters).
- **Impact**: Instant storytelling.

## Sub-Project 1.30: Dual-Axis Synchronization (Grid Harmony) [checked] [checked]
**Goal**: Eliminate messy double-grids in Mixed Charts.
- **Logic**: Force ticks on secondary axis to align with primary axis lines.
  - *Example*: If Left Axis has 5 lines, Right Axis MUST use 5 lines, calculating step size accordingly.
- **Standard**: Follows **Gestalt Grid**: "Container Intelligence" (Clean rhythm).
- **Impact**: Professional, clean finish for complex data.

## Sub-Project 1.31: Dynamic Time Aggregation (Auto-Zoom) [checked] [checked]
**Goal**: Prevent "scribble charts" when showing 365 days on a small screen.
- **Logic**: Calculate `pixelsPerDataPoint`. If `< 5px`, auto-aggregate:
  - 365 Days -> 12 Months.
  - 24 Hours -> 4 Shifts.
- **Standard**: Follows **Advanced Analytics**: "Crowd Control" (Don't dump raw data).
- **Impact**: Always readable trends.

## Sub-Project 1.32: Goal-Aware Axis (Imã de Meta) [checked] [checked]
**Goal**: Prevent target lines from being squashed at the top edge.
- **Logic**: If `MetaValue` is in the top 10% of the Y-Axis range, extend the axis max by 20% to obey the "Rule of Thirds".
- **Standard**: Follows **Gestalt Grid**: "Proximity & Spacing" (Visual Breathing).
- **Impact**: Metas look attainable, not suffocating.

## Sub-Project 1.33: Smart Sorting (Editorial Ranking) [checked] [checked]
**Goal**: Organize categorical chaos into a clear ranking.
- **Logic**: If axis is NOT temporal (dates), default to `order: 'DESC'` (Pareto).
- **Constraint**: **Must be Optional** (`autoSort: boolean`, default `true`). User can override to `none` or `ASC`.
- **Standard**: Follows **Advanced Analytics**: "Pre-Processing" (Sort by Value).
- **Impact**: Immediate insight ("Who is top performer?") vs Analysis Paralysis.

## Sub-Project 1.34: Skeleton Layout Prediction (Zero Shift) [checked] [checked]
**Goal**: Eliminate Cumulative Layout Shift (CLS) during loading.
- **Logic**: Engine runs *before* data fetch using metadata/cache. Renders a precise gray skeleton with final margins.
- **Standard**: Follows **System Architecture**: "Performance & UX".
- **Impact**: Perceived performance feels instant; interface feels solid.

## Sub-Project 1.35: Semantic Value Formatting (Smart Currency/%) [checked] [checked]
**Goal**: Auto-format numbers so they look like "Business Intelligence", not "Raw Math".
- **Logic**:
  - **Currency**: Detect currency context. If `value > 1M`, auto-scale to "R$ 1.5M". Drop cents if `value > 100`.
  - **Percentage**: If `value` is between 0-1 (e.g. 0.45), auto-multiply by 100. If variance < 1%, show 1 decimal (`45.2%`), else 0 decimals (`45%`).
- **Standard**: Follows **Advanced Analytics**: "Editorial Intelligence" (Readability First).
- **Impact**: Zero-config professional numbering.

## Sub-Project 1.36: Grid Elasticity (Vertical Fill Strategy) [checked] [checked]
**Goal**: Solve the "Floating Chart" syndrome (chart using 30% height of a 100% container).
- **Problem**: Engine calculating height based on data (`count * barHeight`) instead of container (`plotHeight`).
- **Logic**:
  - **Check**: If `dataHeight < containerHeight`, calculate `growthRatio`.
  - **Expand**: Distribute the extra whitespace proportionally into `barThickness` (up to a max cap) and `gap` (breathing room).
  - **Anchor**: Force the chart to stretch from Top to Bottom of the Plot Zone.
- **Standard**: Follows **Gestalt Grid**: "Container Intelligence" (Fill the box).
- **Impact**: Charts always look confident and deliberate, never "lost" in whitespace.

## Sub-Project 1.37: Radial Anti-Collision (Spider Legs) [checked] [checked]
**Goal**: Tame the chaos of Pie Chart labels.
- **Logic**: Use an iterative "Spider" algorithm to push labels into two clean columns (left/right) with bent connector lines.
- **Standard**: Follows **Gestalt Grid**: "Common Fate" (Lines guide the eye).
- **Impact**: Magazine-quality Pies, even with tiny slices.

## Sub-Project 1.38: Line Chart Anchor-to-Zero (Truth Control) [checked] [checked]
**Goal**: Ensure visual honesty in Area charts.
- **Logic**:
  - **Area**: Force `Y-Min = 0` (Shapes need a base).
  - **Line**: Allow `auto-scale` (Trends need focus).
- **Standard**: Follows **Advanced Analytics**: "Data Integrity".
- **Impact**: Impossible to create "Misleading Charts" by accident.

## Sub-Project 1.39: Sparkline Simplification (Mini Mode) [checked] [checked]
**Goal**: Keep charts useful at thumbnail sizes.
- **Logic**: If `height < 60px` OR `width < 120px`:
  - **Hide**: Axes, Grid, Legend, Title.
  - **Show**: Line Path + Final Value Dot (Red/Green).
- **Standard**: Follows **System Architecture**: "LOD" (Level of Detail).
- **Impact**: Perfect dashboard density for "KPI Cards".

## Sub-Project 1.40: Editorial Margin Notes (Static Tooltips) [checked] [checked]
**Goal**: Replace interactive tooltips with permanent editorial annotations for print.
- **Logic**:
  - **Detect**: Key data points (Max, Min, Last Point).
  - **Render**: Instead of floating bubbles, draw **Callout Lines** to the margins with static text (e.g., "Highest: R$ 50k").
- **Standard**: Follows **Infography**: "Direct Labeling".
- **Impact**: The story is self-contained in the image; no mouse hover needed.

## Sub-Project 1.41: Vertical Flow Priority (Elasticity Enforcer) [checked]
**Goal**: Solve the "Floating Chart" syndrome by prioritizing vertical fill over aspect ratio for list-based charts.
- **Logic**:
  - **Detect**: If `chartType === 'bar'` (Categorical List).
  - **Action**: Disable `Golden Ratio` padding. Force `marginBottom` to minimum needed for labels.
  - **Growth**: Allow bars to stretch to fill the container height (up to `maxBarThickness`).
- **Standard**: Follows **Gestalt Grid**: "Container Intelligence" (Fill the allocated module).
- **Impact**: Eliminates awkward whitespace in tall containers.

## Sub-Project 1.42: Adaptive Density (Thickness Intelligence) [checked]
**Goal**: Make low-density charts look "Editorial" and "Bold" rather than "Empty".
- **Logic**:
  - **Measure**: Calculate `density = categoryCount / plotHeight`.
  - **Adapt**:
    - **Low Density**: Increase `targetFill` to 0.7 (70% Bar). Boost `maxBarThickness` to 120px.
    - **High Density**: Revert to 0.5 (50% Bar) and standard caps.
- **Standard**: Follows **System Architecture**: "LOD (Level of Detail)" (Scale content to container).
- **Impact**: High-impact visuals for simple data.

## Sub-Project 1.43: Legend-to-Label Conversion (Direct Labeling) [checked] [checked]
**Goal**: Remove the cognitive load of matching colors between legend and line.
- **Logic**:
  - **Check**: Is there space on the right (Series Label Zone)?
  - **Action**: Hide Bottom Legend. Print Series Name next to the last data point of the line.
- **Standard**: Follows **Infography**: "Delete the Ink" (Legends are waste).
- **Impact**: Instant readability, sophisticated editorial look.

- **Impact**: Instant readability, sophisticated editorial look.

## Sub-Project 1.44: Predictive Legend & Layout Compaction (Smart Flex) [checked]
**Goal**: Eliminate wasted whitespace in ALL legend positions (Bottom/Side) by calculating exact pixel demand.
- **Logic**:
  - **Bottom/Top**:
    - **Measure**: Sum width of items. Simulate wrap lines.
    - **Action**: Set `marginBottom` exactly to `lines * height`. Zero "guess" buffer.
  - **Left/Right (Lateral)**:
    - **Measure**: Calculate max width of legend items.
    - **Action**: 
        1. Set `marginLeft/Right` to exactly `maxItemWidth + padding`.
        2. **Vertical Spread**: If legend is tall, allow it to expand. If short (like in your image), center it vertically relative to the plot.
        3. **Chart Expansion**: The chart MUST expand horizontally to fill the space saved by a narrow legend.
- **Standard**: Follows **System Architecture**: "Measurement-First" & "Grid Elasticity".
- **Impact**: Chart expands to fill every available pixel; Legend sits tightly without creating "dead zones".

## Sub-Project 1.45: Radial Label Compositing (Centroid Arbitration) [checked]
**Goal**: Prevent "Label vs Value" collisions inside Pie slices (e.g., "E" overlapping "35.7%").
- **Logic**:
  - **Composite**: Treat (Category + Value) as a single bounding box.
  - **Arbitrate**:
    - **Fit**: If Box fits in slice -> Render centered (e.g., "E \n 35.7%").
    - **No-Fit**: Push Category to "Spider Leg" (External), keep Value inside (or both out).
- **Standard**: Follows **Gestalt Grid**: "Common Region" (Group related elements).
- **Impact**: Clean, readable slices with zero text overlap.

## Sub-Project 1.46: Axis Collision & Stagger (Bounding Box Physics) [checked]
**Goal**: Prevent X-Axis labels from overlapping neighbors (e.g., "Descumprimento..." vs "Falta de...").
- **Logic**:
  - **Detect**: If `labelWidth > colWidth` (Collision Risk).
  - **Action**:
    - **Wrappable**: Enable standard wrapping (3 lines).
    - **Stagger**: If still colliding, offset odd/even labels (y+20px).
    - **Rotate**: Last resort, rotate 45 degrees.
- **Standard**: Follows **System Architecture**: "Constraint Solving" (Physics-based layout).
- **Impact**: Zero overlap on X-Axis, even with long names.

## Sub-Project 1.47: Intelligent Abbreviation (Context-Aware Truncation) [checked]
**Goal**: Replace "..." with semantic abbreviations to save space without losing meaning.
- **Logic**:
  - **Dictionary**: Map common terms (e.g., "Departamento" -> "Dept.", "Janeiro" -> "Jan").
  - **Strategy**: If label > max width, try dictionary lookup *before* hard truncation.
- **Standard**: Follows **Advanced Analytics**: "Editorial Intelligence" (Write like a human).
- **Impact**: Higher data density with full readability.

## Sub-Project 1.48: Smart Date Formatter (Temporal Compression) [checked]
**Goal**: Adapt date formats to fit the available column width automatically.
- **Logic**:
  - **Context**: If data is temporal (Dates/Times).
  - **Adapt**:
    - Broad: "01 Janeiro 2024"
    - Medium: "Jan/24"
    - Narrow: "J" (if sequence is obvious) or "Q1" (Quarter).
- **Standard**: Follows **System Architecture**: "LOD" (Level of Detail).
- **Impact**: Timelines that never break, regardless of screen size.

## Sub-Project 1.49: Editorial Label Balancing (Anti-Orphan) [checked]
**Goal**: Prevent ugly "orphan words" on a single line in multi-line labels/captions.
- **Logic**:
  - **Context**: Long Category Labels or Axis Captions.
  - **Detect**: If label wraps to 2+ lines.
  - **Action**: Use a balancing algorithm to make lines roughly equal length (e.g., "Performance \n de Vendas" instead of "Performance de \n Vendas").
- **Standard**: Follows **Typography**: "Balance & Rhythm".
- **Impact**: Professional layout that avoids hanging words.

## Sub-Project 1.50: Smart Connector Lines (Callout Physics) [checked]
**Goal**: Elegantly handle labels that absolutely absolutely cannot fit.
- **Logic**:
  - **Detect**: If label collides even after abbreviation and staggering.
  - **Action**: Move label to "Margin Space" (safe zone) and draw a bezier connector line to the bar/slice.
- **Standard**: Follows **Infography**: "Direct Labeling".
- **Impact**: Zero clutter, even in chaotic datasets.

## Sub-Project 1.51: Intelligent Text Fitting (The Typesetter) [checked]
**Goal**: Solve the "Guesswork" in sizing category captions.
- **Logic**:
  - **Solver**: Run a mini-competition between strategies for each label:
    1.  *Full Width* (Best)
    2.  *Tight Tracking* (Reduce letter-spacing -2%)
    3.  *Soft Wrap* (Break at logical space)
  - **Decision**: Pick the first strategy that fits the bounding box with > 60% Readability Score.
- **Standard**: Follows **System Architecture**: "Robustness" (Constraint Solving).
- **Impact**: Perfect optical sizing for every single label, no matter how weird the text.

## Sub-Project 1.52: Semantic Axis Hierarchy (Super-Categories) [checked]
**Goal**: Organize repetitive X-axis labels into clean, two-level hierarchies.
- **Logic**:
  - **Sensor**: Detect repeated patterns (e.g., Dates "Jan 24, Feb 24" or Prefixes "Loja A, Loja B").
  - **Action**: Split labels into Level 1 ("Jan", "Feb") and Level 2 Group ("2024").
- **Standard**: Follows **Gestalt Grid**: "Similarity & Proximity".
- **Impact**: Dramatic reduction of visual noise; instant cognitive grouping.

## Sub-Project 1.53: Annotation Gravity (Physics) [checked]
**Goal**: Prevent badges like "Max/Min" from overlapping data by finding the "safest" spot.
- **Logic**:
  - **Physics**: Badges are not fixed. They seek "White Space".
  - **Action**: Scan 8 points around the target datum. Score each by distance from other elements. Choose the winner.
- **Standard**: Follows **System Architecture**: "Constraint Solving" (Force-directed placement).
- **Impact**: "Hand-placed" look for annotations, avoiding clumsy overlaps.

- **Standard**: Follows **System Architecture**: "Constraint Solving" (Force-directed placement).
- **Impact**: "Hand-placed" look for annotations, avoiding clumsy overlaps.


## Sub-Project 1.55: Zero-Truncation Elasticity (Atomic Labels) [checked]
**Goal**: Eliminate "GRU..." truncation in side-labels by implementing atomic word protection and expanded lateral elasticity.
- **Logic**:
  - **Measurement**: Measure not just the full string, but the `maxWordWidth` in the labels.
  - **Constraint**: The `marginLeft` must NEVER be smaller than `maxWordWidth + buffer`.
  - **Elastic Override**: If `isGroupedHeader` is active, relax the `0.35 * width` cap to `0.5 * width` to accommodate hierarchical labels.
- **Standard**: Follows **Gestalt Principles**: "Proximity & Continuity" (A label must be whole to be read).
- **Impact**: Zero ellipses in charts; grouped headers look professional and intentional.




---

## Sub-Project 2: Export Intelligence (Environment Invariants)

**Objective**: Apply the **System Architecture (Section 5.3)** principles to eliminate the "Environment Gap" (Section 2) and enforce a strict **Zero-Truncation Policy** for both labels and legends.

### Phase 1: Environment Invariants & Resolution Handshake
- **Invariant Definition**: Hardcode `EXPORT_PIXEL_RATIO = 3.5` and the strict `font-stack` (Outfit/Inter) as system constants.
- **Engine Handshake**: Update `computeLayout` to use "Virtual Canvas" dimensions. PDF export must ignore the user's current window size (Rule 5.3).
- **Hand-off Protocol**: Implement the "Smart Engine -> Dumb Component" re-render trigger specifically for the export lifecycle (Section 6.1).

### Phase 2: PDF-Specific Measurement Calibration (Measurement-First)
- **Environment Gap Solver**: Implement a `calibrationFactor` in `TextMeasurementService` specifically for PDF rasterization drift (Rule 5.1).
- **Atomic Legend Measurement**: Update `calculatePredictedLegendWidth/Height` to treat each item as an **Atomic Unit**. No legend item (e.g., "2023") should ever be truncated.
- **Resolution-Independent Buffers**: Convert all padding (e.g., 40px safeties) into invariants that scale with the target resolution.

### Phase 3: Grid Stabilization & Lateral Elasticity (Grid-Aware)
- **Module Invariants**: Ensure 1:1 visual fidelity between modules on screen vs PDF, regardless of monitor DPI (Rule 5.4).
- **Viewport Decoupling**: Use `pageWidthInMm * PIXELS_PER_MM` for all PDF layout calculations.
- **Legend Conflict Resolution**: If a legend item is wider than its allocated space, trigger **Lateral Margin Reclaim**: shrink the plot zone to expand the legend container until the widest item fits without truncation (Rule 5.2.1).

### Phase 4: Robustness & Self-Healing (LOD Fallbacks)
- **PDF Retry Loop**: Implement `validateLayout(target: 'pdf')` (Rule 3.2.5).
- **Zero-Truncation Enforcer**: If `isTruncated` is detected in the legend or labels during validation:
    1. Lower font size to `Legibility Floor` (8px).
    2. Switch to `compactMode` or `staggeredMode`.
    3. Re-calculate until truncation is **zero**.
- **Safety Nets**: Explicitly reserve the 40px buffer used in `generateChartImage` to prevent edge clipping (Rule 5.3.3).

### Phase 5: Editorial Print Intelligence (The Magical Layer)
- **Static Callouts**: Automatically convert tooltips into permanent **Editorial Margin Notes** for print (Rule 5.5.16).
- **Direct Labeling Conversion**: For PDF, prefer direct labels (Category next to Bar/Line) over Legends to eliminate the "matching game" (Rule 5.5.17).
- **Truth Anchor**: Force `Y=0` on all PDF Area charts for visual honesty (Rule 5.5.14).

### Phase 6: Observation & Verification
- **Debug Overlays**: Use `debugLayout=true` to visualize the Engine's PDF-calculated "Atomic Boxes" for legends.
- **Regression Audit**: Compare "Short Legend" (e.g., years) and "Long Legend" charts. 
    - **Success Criteria**: No ellipses (`...`) in any legend item in the PDF output.

---

## Sub-Project 2.1: Above-Chart Label Strategy (The Header Mode)

**Goal**: Solve the "Gigantesco Label" problem (see image) by moving text from the side margin to above the bars, maximizing horizontal budget and ensuring zero truncation on any device.

### Phase 1: Header Trigger & Decision Logic (Engine)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Trigger Threshold**: Detect if `maxLabelWidthPx > availableWidth * 0.3`.
- **Strategy Switch**: If triggered, set `labelStrategy: 'top-header'` and `isGroupedHeader: true`.
- **Space Recovery**: Shrink `marginLeft` to 20-30px (just for zero-axis alignment).
- **Elastic Row Height**: Recalculate `rowHeight` as a composition: `textBlockHeight + categoryPadding + barThickness`.

### Phase 2: The Typesetter Expansion (Engine)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Full Width Wrap**: Increase the `wrapThreshold` to use `availableWidth - padding` instead of the narrow side-margin.
- **Line Count Reserve**: Accurately predict if a label needs 1, 2, or 3 lines using the new wide budget.
- **Vertical Gravity**: Add `typeSpecific.categoryVerticalOffset` to push bars down based on the specific label's line count.

### Phase 3: Above-Bar Rendering (Component)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- **Conditional Pivot**: If `strategy === 'top-header'`:
    - Move `category-label` to `x=0` (Start) and `y={-(barGap)}`.
    - Change `text-anchor` to `start`.
- **Zero-Truncation Wrap**: Ensure `wrapLabel` consumes the full width provided by the Engine.
- **Fidelity Guard**: Ensure the `clipPath` and `marginTop` are sufficient to prevent the first label from being clipped by the top container edge.

### Phase 4: Self-Healing & LOD (Robustness)
- **Retry Pass**: If even with Header Mode the text exceeds vertical bounds:
    - Reduce `fontSize` by 10% (LOD Compact).
    - Increase the module's target height if in PDF mode.
- **Export Safety**: Verify that the calculated `rowHeight` is respected by the PDF generator to prevent "text-over-bar" collisions.

#### 🔍 How to Verify (User Action)
1.  **Stress Test**: Input a category name with 100+ characters (e.g., "DEPARTAMENTO DE PLANEJAMENTO ESTRATÉGICO DE RECURSOS HUMANOS E LOGÍSTICA INTEGRADA").
2.  **Expected (Screen)**: The label should hop to the top of the bar, wrap into 2 lines using the full width, and the bar should move down to make room.
3.  **Expected (Export)**: The PNG/PDF must show the full text without any `...` and no overlap with the bar below.

---

## Sub-Project 2.2: Premium Font Unification (The Design DNA)

**Goal**: Eliminate the visual mismatch between the App (browser) and Export (PDF) by unifying the premium font stack (Outfit & Geist Mono) across both environments.

### Phase 1: Global Design System (App DNA)
#### [MODIFY] [globals.css](src/app/globals.css)
- **Primary Registration**: Load **Outfit** and **Geist Mono** in the root `@font-face` or Google Fonts import.
- **Semantic Utilities**: Create `.category-label` (Outfit) and `.data-value` (Geist Mono) utility classes at the CSS level so the browser renders them exactly like the PDF generator.

### Phase 2: Engine Font-Awareness (Intelligence)
#### [MODIFY] [SmartLayoutEngine.ts](src/services/smartLayout/SmartLayoutEngine.ts)
- **Measurement Precision**: Update `TextMeasurementService` to use "Outfit" for category labels and "Geist Mono" for data values during layout calculation (Rule 5.1).
- **Environment Invariants**: Ensure both `target: 'screen'` and `target: 'pdf'` use the same font names to prevent layout drift (Rule 5.3).

### Phase 3: SVG Forceful Typography (Component)
#### [MODIFY] [BarChart.tsx](src/features/charts/components/BarChart.tsx)
- **Class Injection**: Apply `className="category-label"` and `className="data-value"` to all `<text>` and `<tspan>` elements.
- **Style Priority**: Use `!important` or direct `style` overrides to ensure SVG text-rendering doesn't default to browser fallbacks.

### Phase 4: Sync Export Handshake (Fidelity)
#### [MODIFY] [exportUtils.ts](src/utils/exportUtils.ts)
- **Font Sanitization 2.0**: Simplify `fontEmbedCSS` to only include the fonts used in `globals.css`, preventing conflicts.
- **Resolution-Independent Weights**: Ensure bold weights (700/900) look identical on high-DPI PDF output as they do on standard screens.

---

---

## Sub-Project 3: Full Expansion (The Rollout)

**Objective**: systematically port all remaining chart types to the `SmartLayoutEngine`.

### Phase 1: Column Family (The Vertical)
Targeting `ColumnChart` and `StackedColumnChart`.
- **Challenge**: Staggered labels and dynamic bottom margin.
- **Tasks**:
    - [NEW] `src/services/smartLayout/rules/columnRules.ts`: Implement `wrap-or-stagger` strategy for X-axis labels.
    - [MODIFY] `ColumnChart.tsx`: Connect internal margin logic to `computedLayout.margins.bottom`.

### Phase 2: Line Family (The Continuous)
Targeting `LineChart` and `AreaChart`.
- **Challenge**: Y-axis labels on the left vs right, and continuous scales.
- **Tasks**:
    - [NEW] `src/services/smartLayout/rules/lineRules.ts`: Prioritize Aspect Ratio (16:9 preference).
    - [MODIFY] `LineChart.tsx` & `AreaChart.tsx`: Ensure `minPlotWidth` is respected to prevent "squashed" lines.

### Phase 3: Circular Family (The Radial)
Targeting `PieChart`, `DonutChart`, `RadarChart`, `GaugeChart`.
- **Challenge**: Must maintain 1:1 aspect ratio and handle external labels that "orbit" the chart.
- **Tasks**:
    - [NEW] `src/services/smartLayout/rules/radialRules.ts`: Shared logic for square constraints.
    - [MODIFY] `PieChart.tsx` etc.: Remove internal radius calculations in favor of `computedLayout.container`.

### Phase 4: Complex & Mixed (The Advanced)
Targeting `MixedChart` and `PictogramChart`.
- **Challenge**: Multiple axes (Mixed) and non-standard grids (Pictogram).
- **Tasks**:
    - [NEW] `src/services/smartLayout/rules/mixedRules.ts`: Handle dual-axis margin reservation.
    - [MODIFY] `MixedChart.tsx`: Bind secondary axis to `margins.right`.

#### 🔍 How to Verify (User Action)
1.  **Regression Test**: After each phase is merged, open a dashboard with that specific chart type.
2.  **Sanity Check**: Ensure charts didn't shrink to 0 size or disappear.
3.  **Export Test**:
    - Create a dashboard with **one of each type** (Column, Line, Pie, Mixed).
    - Export to PDF.
    - **Success Criteria**: All charts are visible, centered, and have consistent spacing between them. None are cut off.

## Verification Summary (Auditable Checklist)
- [ ] **BarChart (Tracer)**: Long labels expand margins in Editor.
- [ ] **BarChart (Tracer)**: Long labels are not cut off in PDF.
- [ ] **Smart Engine**: `npm test` passes for Layout Logic.
- [ ] **Rollout**: All 16 chart types render without regression.
