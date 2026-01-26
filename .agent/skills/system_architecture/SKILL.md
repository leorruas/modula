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

---

## 7. Lessons Learned (Project History)

### 7.1 Chart Export Fidelity (Conversation 4331873d)

**Problem**: Charts were cropped in PDF exports, fonts were incorrect, legends were invisible.

**Root Cause**:
- PDF export used browser's window size instead of virtual canvas
- Font stack wasn't explicitly mapped (fell back to system fonts)
- No safety buffer for edge clipping

**Solution Applied**:
- Increased `pixelRatio` to 3.5 for high-resolution PDF
- Normalized chart height to respect PDF multi-column layout
- Explicitly mapped fonts (Outfit for narrative, Geist Mono for data)
- Added 40px safety buffer in `generateChartImage`

**Key Learnings**:
1. **Export needs separate layout calculation**: Never use `window.innerWidth` for PDF
2. **Fonts must be explicit**: Fallbacks cause measurement drift
3. **Safety buffers are critical**: Edge clipping is invisible in dev but breaks production
4. **Resolution matters**: `pixelRatio` affects collision detection, not just clarity

**Applied to This Skill**:
- Section 5.3 (Export Fidelity) now mandates virtual canvas
- Section 5.1 (Measurement-First) requires font-specific measurements
- Section 3.2 (Robustness) includes safety buffer requirement

---

### 7.2 Variable Sprawl & Documentation (Conversation 6e818cda)

**Problem**: Chart variables were scattered across multiple files, making it impossible to track dependencies.

**Root Cause**:
- No single source of truth for layout variables
- Each chart component had its own margin/padding logic
- Dependencies hidden in imports (`pdfExportService`, `exportUtils`, `chartTheme`)

**Solution Applied**:
- Created comprehensive variable documentation
- Mapped all dependencies explicitly
- Identified need for centralized Engine

**Key Learnings**:
1. **Hidden dependencies break refactors**: Must map ALL imports before redesigning
2. **Implicit knowledge is dangerous**: Hardcoded values (`40px`, `0.75`) must be documented
3. **Consistency requires centralization**: Ad-hoc calculations guarantee inconsistency

**Applied to This Skill**:
- Phase 1.2 (Layer Abstraction Mapping) now includes dependency tracking
- Phase 1.3 (Master Reference) mandates listing every variable
- Section 2 (Gap Analysis) highlights inconsistency as a primary failure mode

---

### 7.3 Label Wrapping & Layout Prediction (Conversation 1cbd9303)

**Problem**: Labels wrapped incorrectly, legends occupied too much space, vertical space was wasted.

**Root Cause**:
- Component used "guessing" for wrapping (`width / charWidth`)
- Legend reserved fixed space instead of measured space
- No simulation of wrapping before rendering

**Solution Applied**:
- Engine calculates `labelWrapThreshold` based on actual margin
- Aggressive legend reclaim (measure exact space needed)
- Simulate wrapping to reserve correct vertical space

**Key Learnings**:
1. **Never guess text width**: `charWidth * length` is always wrong (proportional fonts)
2. **Simulate before rendering**: Layout must predict wrapped line count
3. **Measure legends precisely**: Fixed margins waste space

**Applied to This Skill**:
- Section 5.1 (Measurement-First) now emphasizes text measurement
- Section 5.2 (Anti-Wrapping) establishes wrapping as last resort
- Section 3.2 (Robustness #2) mandates "Vacuum-Seal Strategy"

---

### 7.4 Componentization & Separation of Concerns (Conversation 5870325a)

**Problem**: Components had mixed responsibilities (calculation + rendering), making them hard to test and maintain.

**Root Cause**:
- No clear boundary between "brain" (logic) and "body" (UI)
- Components did their own margin calculations
- Fallback logic mixed with rendering

**Solution Applied**:
- Design token system (CSS variables)
- Variable-First Rendering (calculate before render)
- Prop-to-Token Mapping (props map to tokens, not direct values)

**Key Learnings**:
1. **Smart Engine → Dumb Component**: Logic must be separate from rendering
2. **Stateless is testable**: Pure functions are easier to verify
3. **Fallbacks indicate incomplete migration**: Should be temporary only

**Applied to This Skill**:
- Section 6.1 (Smart Engine → Dumb Component Protocol) codifies this pattern
- Section 3.1 (Smart Engine Pattern) emphasizes pure functions
- Section 3.2 (Robustness #6) establishes override hierarchy

---

### 7.5 Density & Responsiveness (Multiple Conversations)

**Problem**: Charts looked wrong in different container sizes (too thick in large containers, too thin in small ones).

**Root Cause**:
- Fixed bar thickness regardless of container size
- No density-aware scaling
- Vertical fill strategy missing

**Solution Applied**:
- Calculate density (`categoryCount / plotHeight`)
- Adjust caps based on density (high density = thinner caps)
- Implement vertical fill with safety caps

**Key Learnings**:
1. **One size doesn't fit all**: Layout must adapt to container
2. **Caps prevent absurdity**: Even with fill strategy, need maximums
3. **Density is a spectrum**: Low/medium/high need different strategies

**Applied to This Skill**:
- Section 3.2 (Robustness #3) mandates LOD (Level of Detail)
- Section 5.4 (Grid-Aware Flex Sizing) requires dynamic scaling
- Section 5.5 #12 (Grid Elasticity) codifies vertical fill strategy

---

### 7.6 Contradictions in Planning (This Conversation)

**Problem**: Implementation plan had 55 sub-projects with contradictory requirements.

**Root Cause**:
- Plan evolved organically without consolidation
- No priority system (everything seemed equally important)
- Contradictions not identified until analysis

**Solution Applied**:
- Created analysis skill to detect contradictions
- Consolidated into 5 thematic phases
- Added P0/P1/P2/P3 prioritization

**Key Learnings**:
1. **Plans need analysis too**: Don't trust checkboxes blindly
2. **Contradictions block implementation**: Must resolve before coding
3. **Consolidation reveals patterns**: 55 items → 5 phases shows overlap

**Applied to This Skill**:
- Phase 2 (Gap Analysis) now includes contradiction detection
- Section 3.2 (Robustness) emphasizes clear priorities
- New recommendation: Use plan_analysis skill before implementing

---

## 8. Integration with Other Skills

When applying this skill, also reference:

- **plan_analysis**: Analyze existing plans for contradictions before implementing
- **task_breakdown**: Convert architecture into phased execution
- **componentization**: Structure components to consume Engine output
- **advanced_analytics**: Add editorial intelligence features
- **gestalt_grid**: Apply spacing and proximity principles
### 7.7 Infographic Layout Calibration & Symmetry (Conversation 0907c312)

**Problem**: Even with basic buffers, high-contrast infographic numbers were clipping in PDF exports.

**Root Cause**:
- Multiplier Mismatch: Engine measured fonts at 2.0x while component rendered at 2.6x (Hero + Multiplier).
- Insufficient Buffer: 10% drift buffer wasn't enough for symbols like `%` and `R$` in large fonts.
- Visual Imbalance: Asymmetric charts (long labels vs huge numbers) looked "unstable".

**Solution Applied**:
- Aligned multipliers (2.6x for both Engine and Component).
- Increased `EXPORT_DRIFT_BUFFER` to 1.25x (25% safety).
- Enforced side-margin symmetry for Bar Charts.
- 40px safety gap for right-side values.

**Key Learnings**:
1. **Multipliers must be identical**: Any discrepancy between "Measurement Engine" and "Render Component" guarantees clipping.
2. **Bold Fonts need more drift**: Thick black fonts expand more in PDF rendering than standard weights.
3. **Symmetry == Stability**: In editorial design, balanced margins (left=right) project more authority and professional quality.

**Applied to This Skill**:
- Section 5.1 (Predictive Sizing) updated to recommend 1.25x buffer for high-contrast exports.
- Section 5.3 (Export Fidelity) now mandates multiplier alignment verification.
- Section 3.2 (Robustness) includes "Visual Symmetry" for bar-type layouts.
