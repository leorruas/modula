# Engineering Handbook

## Documentation Protocols

### Business Rules Consistency
*   **Single Source of Truth**: The `docs/business-rules.md` file is the source of truth for all functional requirements.
*   **Update Rule**: Any change to the system's logic, constraints, or features MUST be recorded in `docs/business-rules.md` before or immediately parallel to implementation.
*   **Approval Protocol**: Spontaneous implementation of new features during research, documentation, or debugging tasks is FORBIDDEN. All significant code changes must be proposed in `implementation_plan.md` and approved by the user before execution.
*   **Traceability**: Code changes should reflect the rules defined in the documentation.

## Code Standards
### Philosophy: Robustness First
*   **No Quick Fixes**: Avoid temporary patches or specific hardcoded values that only solve the immediate problem.
*   **Root Cause Analysis**: Always investigate *why* a bug happened before fixing it.
*   **Systemic Solutions**: When fixing a bug, look for opportunities to refactor and improve the underlying system (e.g., centralizing constants in themes, creating reusable hooks).
*   **Scalability**: write code that handles future edge cases, not just the current test case.

### State Management & Data Fetching
*   **Global State**: Use Zustand stores for state shared across features.
*   **Refresh Pattern**: When a global action (e.g., updating settings in a modal) requires a reload of page-level data, expose a `refreshTrigger` number in the store. Components should subscribe to this trigger in their `useEffect` dependencies to re-execute data fetching logic. This avoids page reloads.

### Component Architecture
*   **Modals & Overlays**: Always use React Portals (`ReactDOM.createPortal`) for modals, tooltips, and overlays to escape the stacking context ('z-index wars') of parent containers.
*   **Component Isolation**: Sidebar components should handle their own visibility logic but rely on global stores for data.

### Editorial Data Visualization (Infographic Mode)
*   **Proportional Scale**: Don't use fixed font sizes for data values. Scale them based on magnitude (2.0x for max, 1.0x for min).
*   **Narrative Badges**: Use contextual badges (🏆/🔻) for extremes instead of cluttered axes.
*   **Hierarchy Priority**: Respect the precedence: Manual Overrides > Automated Indicators > Default Styles.
*   **Transparency**: Supporting data (context) should hover at ~60% opacity to let the "Hero" data shine.

### Smart Layout Standards (Predictive Intelligence)
*   **No-Guesswork Policy**: Never use hardcoded pixel offsets or "magic numbers" for positioning elements. All spacing must be derived from the `SmartLayoutEngine`.
*   **Measurement-First Architecture**: Layout follows a strict 3-step lifecycle:
    1.  **Measurement**: `TextMeasurementService` uses an offscreen canvas to calculate exact pixel widths/heights of strings before rendering.
    2.  **Analysis**: `SmartLayoutEngine.analyzeChart` determines complexity (label density, series count).
    3.  **Orchestration**: `SmartLayoutEngine.computeLayout` solves constraints and returns absolute zones and margins.
*   **Environment Handshake**: Measurements must wait for `document.fonts.ready` to eliminate drift between browser and PDF.
*   **Self-Healing**: Components should consume `computedLayout`. If a layout is invalid (collisions detected), the Engine will automatically retry with a more compact LOD (Level of Detail).

### Z-Index Hierarchy
To maintain a predictable stacking order, follow these tiers:
*   **Level 0 (Base)**: Canvas, Grids, Backgrounds.
*   **Level 10-100**: Active elements on Canvas (Charts, Selections).
*   **Level 500**: Sidebars and fixed panels.
*   **Level 600**: Primary Header and navigation bars.
*   **Level 1000**: Dropdowns, Tooltips, and Modals.
*   **Level 9999**: Global Toast notifications and critical system overlays.

## Third-Party Libraries
*   **Input Strictness**: Do not assume libraries behave like browsers.
    *   *Example*: `jsPDF` does not understand CSS font stacks ("Helvetica, Arial"). Use strict, single values ("Helvetica").
*   **Fallbacks**: Always configure global defaults (e.g., `doc.setFont`) to prevent library-specific crashes or unwanted defaults (like Times New Roman).
*   **Rasterization as Fallback**: When vector fidelity requires excessive hacks or is flaky across environments, prefer High-Resolution Rasterization to guarantee User Trust.
*   **Firebase/Firestore Strictness**:
    *   **No Undefined**: Firestore does not support `undefined` values in documents. Always use `null` or omit the key entirely using conditional spreading: `{ ...(condition && { key: value }) }`.
    *   **Timestamp Consistency**: Use `Date.now()` (number) or Firestore `Timestamp` consistently. The project currently uses `Date.now()` for `createdAt` and `updatedAt`.
