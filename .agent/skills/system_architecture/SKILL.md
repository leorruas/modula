---
name: Exhaustive Legacy Analysis & System Design
description: Methodology for reverse-engineering complex legacy systems and designing robust, smart architectures based on deep discovery.
---

# Exhaustive Legacy Analysis & System Design

This skill codifies the process of understanding undocumented/complex legacy codebases and conducting the architectural planning for "Smart Systems" that supersede them.

## When to Use

- **New Smart System**: When asked to create "smart", "automatic", or "intelligent" engines.
- **Legacy Refactor**: When modifying code with >50 undocumented variables or implicit dependencies.
- **Export/Integrity Issues**: When fixing bugs that only appear in specific environments (PDF vs Screen).
- **Unknown Unknowns**: When the user asks "How does this work?" and you don't have a docs file for it yet.

## Skill Integration Matrix

| Preceding Skill | This Skill | Following Skill |
|-----------------|------------|-----------------|
| **Clarify Requirements** <br> (Goal) | **System Architecture** <br> (Map the terrain) | **Task Breakdown** <br> (Build phase-by-phase) |
| **Infography** <br> (Visual Story) | **System Architecture** | **Advanced Analytics** <br> (Editorial Intelligence) |
| **Typography** <br> (Font Metrics) | **System Architecture** | **Componentization** <br> (Dumb Component Structure) |
| **Gestalt Grid** <br> (Spacing) | **System Architecture** | **Export** <br> (Review PDF/PNG) |

---

## 1. Phase 1: Deep Discovery (Exhaustive Search)

The goal is to map **implicit knowledge** buried in the code into **explicit documentation**.

### 1.1 Iterative "Grep" Strategy
Never assume you know the variables. Search for usage patterns to discover them.
1.  **Broad Search**: Search for generic terms (`width`, `margin`, `style`).
2.  **Pattern Recognition**: Identify repeated logic (e.g., `Math.max(..., 1)`, `toFixed(0)`).
3.  **Specific Search**: Drill down into identified patterns (e.g., specific libraries like `html-to-image`).
4.  **Implicit Variables**: Look for hardcoded values (`40px`, `0.75`).

### 1.2 Layer Abstraction Mapping
Organize findings by architectural layer, not just by file.
- **Config**: What the user sets.
- **Calc**: Math that happens before render.
- **Component**: The React/Logic layer.
- **Render**: The SVG/DOM layer.
- **Export**: What leaves the system (PDF/PNG).

### 1.3 The "Master Reference" Artifact
Create a dedicated `*-variables-reference.md` that:
- Lists **every single variable** found.
- Compares behavior across similar components (e.g., Bar vs Column).
- Highlights **inconsistencies** (Gaps).

---

## 2. Phase 2: Gap Analysis & Synthesis

Before designing, define *why* the legacy system fails.

- **Inconsistency**: "BarChart uses 40px margin, LineChart uses 20px".
- **Rigidity**: "Labels overflow because max-width is hardcoded".
- **Environment**: "Export fails on 3x screens because it relies on `devicePixelRatio`".

---

## 3. Phase 3: Smart System Specification

Design the new system to orchestrate the variables found in Phase 1.

### 3.1 The "Smart Engine" Pattern
Instead of hardcoded logic scattered in components, create a central Engine.
- **Input**: Analysis of content + Constraints.
- **Process**: Pure functions with clear rules.
- **Output**: `ComputedLayout` object passed to dumb components.

### 3.2 Robustness Checklist (Must-Haves)
A "Smart System" is not just about logic; it's about handling edge cases and ensuring visual stability.
1.  **No-Guesswork Policy**: Never use hardcoded pixel offsets or "magic numbers". All spacing must be derived from the Engine.
2.  **Vacuum-Seal Strategy**: Orchestrate the layout so the chart expands as a fluid to fill the module, leaving zero accidental white space.
3.  **LOD (Level of Detail)**: How to degrade gracefully? (Tiny vs Normal vs Spacious).
4.  **Constraint Solving**: What happens when items collide? (Greedy vs Force-Directed).
5.  **Self-Healing (Retry Loop)**: Implement a `validateLayout()` pass. If collisions or overflow are detected, the Engine must automatically retry with a more compact LOD before rendering.
6.  **Safety Nets**: User Overrides > Smart Logic > Defaults. ("The User is King").
7.  **Environment Independence**: Fixed pixel ratios for export (e.g., 3.125 for PDF 300dpi).
8.  **Performance**: Memoization strategies for expensive calcs (e.g., text measurement).
9.  **Observability**: Visual debug modes (`debugLayout=true`) showing margins, plot, and collision boxes.

---

## 5. The Intelligent Layout Framework

This section mandates "Intelligent System" thinking for all layout-related features. Every system must be predictive, grid-aware, and export-stable.

### 5.1 Measurement-First (Predictive Sizing)
Never "guess" or hardcode margins/offsets based on average data.
1.  **Mandatory measurement**: Use `TextMeasurementService` to calculate real pixel/mm widths of strings, icons, and badges.
2.  **Worst-Case Analysis**: Always calculate layout based on the **longest labels** and **highest values** provided in the dataset.
3.  **Buffer Assets**: Propose `EXPORT_BUFFER_RATIO` (e.g., 1.10) to account for slight font rendering differences between Screen and PDF.

### 5.2 Constraint Orchestration (Anti-Wrapping)
**Rule**: Text wrapping is the LAST resort (or strictly forbidden). It breaks verticality and creates "squashed" exports.
**Intelligent Resolution Hierarchy**:
1.  **Dynamic Margin Reclaim**: Recalculate and pull space from neighboring zones (e.g., shrinking the plot area).
2.  **Preventive Staggering**: Offset items vertically/horizontally without wrapping.
3.  **Proportional Shrinking (LOD)**: Scale font-sizes down to a "Legibility Floor" (e.g., min 8px).
4.  **Implicit Truncation**: Use ellipsis (`...`) while maintaining fixed positions.

### 5.3 Export Fidelity (Invariants)
Layouts must behave identically across targets.
1.  **Resolution Safety**: Account for high-res `pixelRatio` (3.5x for PDF) to prevent item collision at high zoom.
2.  **Font Sanitization**: Ensure calculations use the strict font-stack defined in [exportUtils.ts](file:///Users/leoruas/Desktop/modula/src/utils/exportUtils.ts).
3.  **Safety Padding**: Always reserve the fixed 40px buffer used in `generateChartImage` to prevent edge clipping in PNG/PDF.

### 5.4 Grid-Aware Flex Sizing
1.  **Legibility Floor**: Establish minimum dimensions for the "Plot Zone" (e.g., 100px). If the user-defined grid is too small, trigger radical LOD degradation.
2.  **Dynamic Plot Scaling**: Scale internal SVG coordinates/viewBox to maximize space within the `module.w` and `module.h` constraints.
3.  **Dependency Verification**: Every layout change **MUST** be verified against [pdfExportService.ts](file:///Users/leoruas/Desktop/modula/src/services/pdfExportService.ts).

### 5.5 Advanced Intelligence Features (The "Magical" Layer)
To achieve "Editorial Intelligence", the system must go beyond basic layout:
1.  **Self-Healing Layouts**: Implement a `validateLayout()` retry loop. If collision is detected, re-calculate with stricter constraints before rendering.
2.  **Narrative Axis**: Prioritize "Story Points" (Max, Min, Target) over mechanical D3 ticks. Remove noise.
3.  **Smart Legend Grid**: Use dense CSS Grid for legends instead of flex-wrap holes.
4.  **Semantic Consistency**: Smart Color Assignment based on series name hash (e.g., "Revenue" is always Blue).
5.  **Outlier Highlighting**: Automatically detect and highlight statistical outliers (Z-Score > 2).
6.  **Dual-Axis Sync**: Force secondary axis ticks to align perfectly with primary grid lines.
7.  **Dynamic Aggregation**: Auto-group time series (Days -> Months) if density < 5px/point.
8.  **Goal-Aware Axis**: Extend Y-Axis if the Target Line is uncomfortably close to the top edge.
9.  **Smart Sorting (Optional)**: Default non-temporal categories to `DESC` order for instant ranking.
10. **Skeleton Prediction**: Pre-calculate layout for Zero-CLS loading states.
11. **Semantic Formatting**: Smart scaling (k/M/B) and precision adaptation for Money/Percent.
12. **Grid Elasticity**: Vertical Fill Strategy to prevent "floating" charts in large containers.
13. **Radial Anti-Collision**: "Spider Legs" algorithm to organize Pie labels.
14. **Truth Anchor**: Force `Y=0` for Area charts; allow auto-scale for Lines.
15. **Sparkline Mode**: Auto-strip decoration for tiny charts (`<60px`).
16. **Editorial Callouts**: Replace Interactive Tooltips with static margin notes for export.
17. **Direct Labeling**: Convert legends to direct adjacent labels for Line Charts.

---

## 6. Integration with Componentization

The **System Architecture** skill defines *what* to calculate; the **Componentization** skill defines *how* to render it.

### 6.1 The "Smart Engine -> Dumb Component" Protocol
Strictly separate concerns to avoid "God Components":

1.  **The Brain (Services/Engine)**:
    -   Handles ALL math, measurement, and decision making.
    -   Output: A pure data object (`ComputedLayout`) containing exact pixel values (`x`, `y`, `width`, `height`, `clipPath`).
    -   *Rule*: No JSX here.

2.  **The Body (Components/UI)**:
    -   Receives `ComputedLayout`.
    -   Blindly applies styles: `<div style={{ left: layout.zones.plot.x }} />`.
    -   *Rule*: No `Math.max` or layout logic here. Only rendering.

3.  **The Hand-off**:
    -   Use the **Componentization Skill** to structure the component into atoms (`Axis`, `Bar`, `Legend`) that consume these pre-calculated props.

Once the **System Design (`architecture.md`)** is complete:

1.  Use the **Task Breakdown Skill** to split implementation into phases:
    - Phase 1: Foundation (Engine shell).
    - Phase 2: Core Logic per Component.
    - Phase 3: Validation & Debug Tools.
    - Phase 4: Migration (Refactoring legacy).

> **Rule of Thumb**: Do not start coding the Engine until you have mapped >90% of the legacy variables. The "unknown unknowns" are what break layout engines.
