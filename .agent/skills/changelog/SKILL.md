---
name: Changelog Generator
description: Automates the creation and update of docs/CHANGELOG.md based on git history.
---

# Changelog Generator Skill

This skill allows you to generate a professional changelog from the project's git history, adhering to Conventional Commits.

## Capabilities

- **Technical Logging**: Automatically tracks deployments and GitHub synchronizations via git tags.
- **Categorization**: Groups entries by tag prefix:
  - `🚀 deploy-*`: Production deployments.
  - `📤 sync-*`: GitHub synchronizations/pushes.
  - `🏆 v*`: Public releases (semver).
- **Commit History**: Automatically extracts and categorizes commits (Features, Fixes, etc.) per version.
- **Audit Trail**: Provides a clear technical history for reference, not for narrative walkthroughs.

## Usage

### Manual Execution

You can regenerate the changelog at any time:
```bash
npm run changelog
```

### GitHub Synchronization
To push changes to GitHub and log the action:
```bash
npm run sync
```
This creates a `sync-TIMESTAMP` tag, pushes to origin, and updates the log.

### Script Location

The script is located at `.agent/skills/changelog/update-changelog.js`.

## Configuration

The script output is saved to `docs/CHANGELOG.md`.
To modify the output format, edit the `update-changelog.js` file in this directory.
