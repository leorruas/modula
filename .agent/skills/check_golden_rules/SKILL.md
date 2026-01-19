---
description: The final gatekeeper to ensure no "Golden Rules" (PDF safety, Documentation, etc.) are violated.
---

# Check Golden Rules Skill

This skill is the "Safety Inspector". It is run at the verification stage, usually before calling a task complete. It catches the things that are easy to forget but painful to fix later.

## The Golden Rules Checklist

### 1. The PDF/Export Rule (CRITICAL)
- [ ] **Static Charts**: Did you add an animation to a chart?
    - *Rule*: Charts MUST rely on standard SVG/Canvas rendering without CSS animations or complex HTML-only overlays if they are to be exported.
    - *Check*: If `html2canvas` or `jsPDF` runs, will this look exactly the same?
- [ ] **Font Loading**: Did you introduce a new font?
    - *Check*: Is it correctly loaded in the PDF generator?

### 2. The Documentation Rule
- [ ] **Sync**: Did you change how a feature works?
    - *Check*: Does `docs/business-rules.md` reflect this change?
    - *Check*: Does `docs/ENGINEERING_HANDBOOK.md` need an update?
- [ ] **Changelog**: Is this change significant enough for the changelog?

### 3. The "No Quick Fixes" Rule
- [ ] **Hardcoding**: Did you use a magic number (e.g., `width: 325px`)?
    - *Check*: Should this be a project config or a constant?
- [ ] **Props Drilling**: Are you passing a prop through 5 layers?
    - *Check*: Should this be in a Zustand store?

### 4. The Clean Up Rule
- [ ] **Logs**: Did you leave `console.log` statements?
- [ ] **Comments**: Did you leave commented-out code blocks?

## Failure Protocol
If ANY of these checks fail:
1.  **Do not mark the task as complete.**
2.  **Fix the violation.**
3.  **Re-run this check.**
