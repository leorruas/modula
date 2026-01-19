---
description: Guidelines for testing the application
---

# Testing Skill

This skill outlines the testing protocols for ensuring application reliability.

## 1. Automated Testing
The project uses **Vitest** and **React Testing Library** for automated testing.

### Running Tests
- `npm test`: Runs all tests once.
- `npm run test:watch`: Runs tests in watch mode.
- `npm run test:ui`: Opens Vitest UI for a better visual overview.

### Writing Tests
- **Unit Tests**: Place in `*.test.ts` files (e.g., `src/utils/math.test.ts`).
- **Component Tests**: Place in `*.test.tsx` files (e.g., `src/components/MyComponent.test.tsx`).
- Use `@testing-library/react` for component rendering and `screen` for querying elements.

## 2. Manual Verification Plans
- Always create a **Verification Plan** in the `implementation_plan.md`.
- **Pre-Verified Steps**: Before asking the user to review, run basic checks yourself (build, run, check console).

## 3. UI/UX Verification
- **Visual Check**: Does it look like the design? Use `generate_image` or external tools if you need mockups.
- **Responsiveness**: Check how components behave on different screen sizes.

## 4. User Acceptance Testing (UAT)
- Provide clear instructions in `walkthrough.md` for the user to perform UAT.
- "Click button X, expect Y."
