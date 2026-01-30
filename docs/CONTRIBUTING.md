# Contributing to Modula 🤝

Welcome! This guide outlines the workflow and standards for contributing to the Modula project.

## 1. Development Workflow

We follow a structured tasks workflow using the Agentic AI.

1.  **Task Initiation**: Start a new task with a clear objective.
2.  **Planning**: Always create an `implementation_plan.md` before writing code for complex features.
3.  **Execution**: Implement changes following the plan.
4.  **Verification**: Verify changes and create a `walkthrough.md`.

## 2. Coding Standards

- **TypeScript**: Use strict typing. Avoid `any`.
- **Styling**: Use Tailwind CSS utility classes. Avoid inline styles unless dynamic.
- **Components**: Follow the Feature-Sliced Design pattern. Keep components small and focused.

## 3. Documentation

- **Business Rules**: If you change *how* something behaves, update `docs/business-rules.md`.
- **UI Changes**: If you change *how* something looks, update `docs/style-guide.md`.
- **Architecture**: If you add a new module, update `docs/ARCHITECTURE.md`.

## 4. Git Conventions

- **Commits**: Use conventional commits (e.g., `feat: add dual axis support`, `fix: layout clipping`).
- **Branches**: Feature branches should be descriptive (e.g., `feature/dual-axis-charts`).

## 5. Testing

- Run tests before pushing: `npm test`
- Ensure new logic is covered by unit tests.
