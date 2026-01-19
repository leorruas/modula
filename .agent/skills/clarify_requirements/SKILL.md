---
description: Enforces a requirements gathering phase before any implementation to avoid assumptions.
---

# Clarify Requirements Skill

This skill ensures that we fully understand the user's intent and the technical implications of a request *before* writing any code. It is designed to prevent "assumed implementation" where we guess details like units, edge cases, or UI states.

## When to Use
- **ALWAYS** at the start of a `PLANNING` phase for a new feature.
- When the user request is vague (e.g., "Add a custom size").
- When a request implies UI changes but provides no design specifics.

## The Protocol

### 1. The "Assumption Check"
Before writing a line of code or a plan, list every assumption you are making.
*   *Do I know the units? (mm, px, cm)*
*   *Do I know the default state?*
*   *Do I know how this interacts with existing features (e.g. PDF export)?*
*   *Do I know the mobile behavior?*

### 2. The Questionnaire
If you identified critical assumptions, STOP and ask the user.
Format your questions clearly:

> "To ensure the [Feature Name] is implemented correctly, I need to clarify a few details:
> 1.  **Metric**: Should the input be in `mm` or `px`?
> 2.  **Constraints**: Is there a max/min limit?
> 3.  **Persistence**: Should this setting be saved to the project or is it session-only?"

### 3. The "Anti-Scope" (What we are NOT doing)
Explicitly state what is out of scope to avoid scope creep.
*   *Example: "This task covers adding the UI for 'Custom Size', but does not cover auto-scaling existing chart elements."*

## Output
If you use this skill, your output to the user should be a set of clarifying questions or a statement confirming that requirements are clear and listing the confirmed constraints.
