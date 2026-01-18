---
description: Guidelines for maintaining project documentation
---

# Documentation Skill

This skill governs the lifecycle of project artifacts and documentation.

## 1. Core Artifacts
- **task.md**: Track granular progress of the current objective. Update status to `[/]` (in progress) and `[x]` (done).
- **implementation_plan.md**: Create/Update during PLANNING mode. Document proposed changes, breaking changes, and verification steps.
- **walkthrough.md**: Update after VERIFICATION. Document what was done, evidence of testing, and user guides.

## 2. Project Docs
You must update the following documents, when the improvement has been approved, appending the new information to the document or altering the existing.
- **docs/engineering-handbook.md**: Reference for coding standards.
- **docs/business-rules.md**: Source of truth for logic. Update if logic changes.
- **docs/style-guide.md**: Reference for UI/UX patterns.

## 3. Update skills
In case, any of those changes have created some new rule to update the skills, you should also update the skills with the new rule. And inform the user about it.

## 4. Update Routine
- Before finishing a task, ensure `task.md` is updated.

## 5. Philosophy
- **Why > What**: Documentation should explain *why* a decision was made (e.g., "Why we use this specific axis offset"), not just what the value is.
- **Robustness**: Documentation must be kept in sync. Outdated docs are "technical debt".
- **No Quick Fixes**: Do not just comment out code; explain deprecations or removals properly.

