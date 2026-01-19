---
description: Guidelines for adding, auditing, and managing project dependencies to avoid bloat.
---

# Analyze Dependencies Skill

This skill ensures that we treat dependencies as a liability, not just an asset. Every new package adds weight, security risk, and maintenance overhead.

## Protocol for Adding a New Dependency

Before running `npm install [package]`, you MUST answer:

1.  **Necessity**: Can this be done with native browser APIs or existing utils?
    - *Example*: Don't install `lodash` just for `debounce` if we can write a 5-line utility.
2.  **Size**: What is the bundle size cost?
    - *Check*: specific to the package (e.g. via bundlephobia).
3.  **Duplication**: Do we already have a library that does this?
    - *Check*: Don't install `moment` if we have `date-fns`.
    - *Check*: Don't install a new UI library if we are using `shadcn/ui` + `radix`.

## Protocol for Auditing (Periodic)

1.  **Unused check**: Are there packages in `package.json` that are no longer imported?
2.  **Version check**: Are we on a very old version with security flaws?
3.  **Documentation**: Update `docs/dependencies.md`.
    - *Action*: If you add a Major dependency, you MUST update `docs/dependencies.md` explaining *why* it was added and what it does.

## Critical Files
- `package.json`
- `docs/dependencies.md`
