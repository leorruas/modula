---
name: Documentation
description: Guidelines and standards for maintaining project documentation, including architecture, contributing guides, and business rules.
---

# Documentation Skill

This skill governs the lifecycle of project artifacts and static documentation. It ensures that knowledge is not just stored but structurally organized and kept utilizing a "Gold Standard" approach.

## 1. The `docs/` Directory Standard

The `docs/` directory is the single source of truth for the project. It MUST contain the following files:

### Essential Documents
- **`docs/README.md`**: The entry point. An index of all available documentation.
- **`docs/ARCHITECTURE.md`**: High-level system design, technology decisions, and directory structure.
- **`docs/CONTRIBUTING.md`**: Guidelines for developers, git conventions, and workflow standards.
- **`docs/CHANGELOG.md`**: Automated history of changes (managed by `changelog` skill).

### Knowledge Base
- **`docs/business-rules.md`**: The absolute source of truth for logic, constraints, and product requirements.
- **`docs/style-guide.md`**: Visual standards, UI patterns, and design system rules.
- **`docs/roadmap.md`** (Optional): Future plans and strategic features.

## 2. Maintenance Rules

1.  **Sync-on-Change**: If you modify the logic of a feature, you MUST check and update `docs/business-rules.md`.
2.  **Visual Consistency**: If you add new UI components or change styles, you MUST update `docs/style-guide.md`.
3.  **Architecture Drift**: If you introduce a new major library or folder structure, update `docs/ARCHITECTURE.md`.
4.  **No Dead Links**: Regularly verify that links in `docs/README.md` are valid.

## 3. Modula Specifics
This project (`modula`) relies heavily on **Smart Layout Engines** and **Geometric Constraints**.
- Any change to the layout engine layout logic MUST be documented in `docs/business-rules.md` under the "Smart Layout Rules" section.
- Changes to chart aesthetics (Colors, Fonts, Spacing) MUST be reflected in `docs/style-guide.md`.

## 4. Artifacts vs Docs
- **Artifacts** (`task.md`, `implementation_plan.md`, `walkthrough.md`) are *ephemeral* and context-dependent. They live in the `.agent/brain` directory.
- **Docs** (`docs/*.md`) are *permanent* and accessible to the team. They live in the repository.
- **Transition**: Valuable insights from Artifacts should be migrated to Docs at the end of a task (e.g., extracting a new Business Rule from a `walkthrough.md`).
