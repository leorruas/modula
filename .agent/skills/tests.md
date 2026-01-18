---
description: Guidelines for testing the application
---

# Testing Skill

This skill outlines the testing protocols for ensuring application reliability.

## 1. Automated Testing (Future)
- Currently, the project does not have a robust automated testing suite (Jest/Cypress).
- **Action**: When adding critical logic, consider adding a simple unit test file if the infrastructure allows.

## 2. Manual Verification Plans
- Always create a **Verification Plan** in the `implementation_plan.md`.
- **Pre-Verified Steps**: Before asking the user to review, run basic checks yourself (build, run, check console).

## 3. UI/UX Verification
- **Visual Check**: Does it look like the design? Use `generate_image` or external tools if you need to mockups, but mostly rely on your code structure.
- **Responsiveness**: Check how components behave on different screen sizes (mentally model or use browser tool if available).

## 4. User Acceptance Testing (UAT)
- Provide clear instructions in `walkthrough.md` for the user to perform UAT.
- "Click button X, expect Y."
