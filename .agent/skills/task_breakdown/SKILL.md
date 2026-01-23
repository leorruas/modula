---
name: Task Breakdown & Phased Execution
description: Guidelines for decomposing complex objectives into safe, atomic, and testable phases to ensure project stability.
---

# Task Breakdown & Phased Execution Skill

This skill provides a systematic approach to handling complex coding tasks. It shifts the mindset from "building the whole features at once" to "executing a series of safe, verifiable micro-tasks".

## When to Use
- **Complex Features**: Any task estimated to take more than 5 tool calls or involving multiple files.
- **Refactoring**: When changing core logic, database schemas, or API contracts.
- **High Risk**: When touching critical paths (e.g., authentication, data saving, export logic).

## The ACID Protocol

To ensure the project remains stable, every phase must satisfy the **ACID** properties of coding:

1.  **Atomic**: It handles one logical unit of work (e.g., "Add the function", "Call the function").
2.  **Consistent**: The codebase compiles and runs after *every* phase.
3.  **Isolated**: Changes in this phase do not break unrelated features.
4.  **Durable**: The work is verifiable and can be saved/committed.

## Execution Strategy

### Phase 1: The "Skeleton" (Structure)
Create the files, classes, and empty functions first.
*   **Goal**: Ensure files exist and imports work.
*   **Verify**: `npm run build` (should pass with no unused vars or missing file errors).
*   **Example**: `Create file Helper.ts`, `Export empty function calculate()`.

### Phase 2: The "Logic" (Implementation)
Implement the core logic within the new structure, often using mocks or hardcoded data initially.
*   **Goal**: the logic works in isolation (unit level).
*   **Verify**: Run a unit test or a script to call the function and print the output.

### Phase 3: The "Wiring" (Integration)
Connect the new logic to the UI or the rest of the app.
*   **Goal**: The feature is visible/usable.
*   **Verify**: Manual interaction in the browser or integration test.

### Phase 4: The "Polish" (Refinement)
Handle edge cases, styling, and error states.
*   **Goal**: Production readiness.
*   **Verify**: Try to break it (empty inputs, network errors).

## The "Stop the Bleeding" Rule
If a phase causes a build error or regression that takes > 5 minutes to fix:
1.  **STOP**.
2.  **ROLL BACK** to the previous stable phase.
3.  **RE-EVALUATE** the approach. -> Do not "fix forward" blindly.

## Handling Gigantic Tasks (Epics)
For massive undertakings (e.g., "Rewrite the entire rendering engine" or "Migrate database"), the standard 4-phase ACID protocol applies **recursively**.

### 1. Recursive Decomposition
Do not try to fit the entire epic into one `task.md`. Instead, break the Epic into **Sub-Projects**.

> **Pro Tip**: Use the **Exhaustive Legacy Analysis & System Design Skill** first to map out the "terrain" before defining these sub-projects.

*   **Epic**: "Migrate to New Database"
    *   **Sub-Project 1**: "Create new Schema types and Migration Scripts" (Follows ACID Phases 1-4)
    *   **Sub-Project 2**: "Double-write to both DBs" (Follows ACID Phases 1-4)
    *   **Sub-Project 3**: "Switch Read Path" (Follows ACID Phases 1-4)

### 2. Tracer Bullets
Before committing to a full implementation of an Epic, fire a "Tracer Bullet":
*   Implement a **thin, end-to-end slice** of the functionality first.
*   **Goal**: Prove the architecture works before building the weight of the whole feature.
*   *Example*: If building a new Charting Engine, implementing *one* simple line chart from API to Pixel to prove the data flow.

### 3. Explicit Milestones
Define "Save Points" where the code is merged and stable.
*   Never go more than 2-3 sub-projects without a full user review and merge.

## Task.md Integration
When creating your `task.md` or `implementation_plan.md`, explicitly label your phases:

```markdown
- [ ] **Phase 1: Structure**
    - [ ] Create `NewComponent.tsx`
    - [ ] Update Router
- [ ] **Phase 2: Logic**
    - [ ] Implement `useDataHook`
    - [ ] Verify data fetching
- [ ] **Phase 3: Integration**
    - [ ] Connect Hook to Component
    - [ ] Verify UI rendering
```
