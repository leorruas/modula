---
name: Changelog Generator
description: Automates the creation and update of docs/CHANGELOG.md based on git history.
---

# Changelog Generator Skill

This skill allows you to generate a professional changelog from the project's git history, adhering to Conventional Commits.

## Capabilities

- **Generate Changelog**: Scans git tags and commits to create a versioned history.
- **Release Types**: Distinguishes between Public Releases (`vX.Y.Z`) and Tracking Versions (other tags).
- **Categorization**: Groups changes by type (Features, Fixes, Docs, etc.).
- **Timestamps**: Includes date and time for each commit.

## Usage

### Manual Execution

You can run the changelog generator directly via npm:

```bash
npm run changelog
```

### Script Location

The script is located at `.agent/skills/changelog/update-changelog.js`.

## Configuration

The script output is saved to `docs/CHANGELOG.md`.
To modify the output format, edit the `update-changelog.js` file in this directory.
