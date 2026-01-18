---
description: Instructions for building and verifying the application
---

# Build Skill

This skill ensures the application preserves integrity through build verification.

## 1. Run Build Command
- Execute `npm run build` to trigger the Next.js build process.
- This checks for:
    - TypeScript type errors
    - ESLint errors
    - Build optimization issues

## 2. Address Errors
- If the build fails, analyze the error output.
- Fix TS errors in `src/types` or component props.
- Fix unused variables or imports.

## 3. Verify Output
- Ensure the build completes with a "Compiled successfully" or similar success message.
- Check for any "Linting error" warnings that might block deployment.
