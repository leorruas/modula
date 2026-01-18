# Engineering Handbook

## Documentation Protocols

### Business Rules Consistency
*   **Single Source of Truth**: The `docs/business-rules.md` file is the source of truth for all functional requirements.
*   **Update Rule**: Any change to the system's logic, constraints, or features MUST be recorded in `docs/business-rules.md` before or immediately parallel to implementation.
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

## Third-Party Libraries
*   **Input Strictness**: Do not assume libraries behave like browsers.
    *   *Example*: `jsPDF` does not understand CSS font stacks ("Helvetica, Arial"). Use strict, single values ("Helvetica").
*   **Fallbacks**: Always configure global defaults (e.g., `doc.setFont`) to prevent library-specific crashes or unwanted defaults (like Times New Roman).
*   **Rasterization as Fallback**: When vector fidelity requires excessive hacks or is flaky across environments, prefer High-Resolution Rasterization to guarantee User Trust.
