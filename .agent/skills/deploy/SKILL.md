---
name: Deploy Skill
description: Automates the build, git tagging, changelog generation, and deployment to Firebase Hosting.
---

# Deploy Skill

This skill handles deployment to **Firebase Hosting** and ensures compatibility with **Vercel**. It automates build verification (static export), versioning, and documentation updates.

## Why Static Export?

The project is configured with `output: 'export'` in `next.config.ts`.
- **Firebase Hosting**: Requires static files in the `out/` directory.
- **Vercel**: While Vercel supports dynamic Next.js routes, keeping it static ensures both platforms can serve the exact same build artifact.
- **Routing Strategy**: To maintain static export compatibility, we use **query parameters** (e.g., `/editor?projectId=...`) instead of dynamic segments (e.g., `/editor/[projectId]`).

## 0. Strict Protocol
- **Approval Required**: Deployment is a critical action. It should only be performed after user confirmation of the changes and build status.
- **Git State**: Ensure all changes are committed before running the deploy skill.
- **Firebase Account Verification**: Before deploying, verify that you're logged into the correct Firebase account. The Modula project uses `leo.ruas@ifmg.edu.br`.

## Account Verification

The user has two Firebase accounts:
- `leoruas@gmail.com`
- `leo.ruas@ifmg.edu.br` ✅ **Use this for Modula**

### Verify Current Account

Before deploying, check which Firebase account is currently active:

```bash
firebase login:list
```

If the wrong account is active, you'll need to log out first and then log in with the correct account:

```bash
firebase logout
firebase login
```

When prompted, select or authenticate with `leo.ruas@ifmg.edu.br`.

> [!TIP]
> During the login process, you may be asked about enabling Gemini features and usage collection. You can answer 'No' to both prompts.

## Capabilities

- **Automated Tagging**: Automatically creates a git tag (e.g., `v0.1.0-deploy-TIMESTAMP`) to mark exactly what was shipped.
- **Changelog Sync**: Runs the changelog generator to ensure `docs/CHANGELOG.md` is aware of the new deployment.
- **Build Verification**: Runs `npm run build` to ensure only working code is deployed.
- **Firebase Deployment**: Runs `firebase deploy` to push the static export to Hosting.

## Usage

### Execution

Run the deployment script via npm:

```bash
npm run deploy
```

### Script Location

The script is located at `.agent/skills/deploy/exec-deploy.js`.

## Configuration

The script assumes:
1. `firebase.json` is configured for Hosting.
2. `next.config.ts` has `output: 'export'`.
3. The codebase uses **query parameters** for routing to support static export.
4. The codebase uses Conventional Commits for the changelog.

## Vercel Deployment

The project is deployed on **Vercel** with automatic git integration and manual CLI support.

- **Account**: `leoruas@gmail.com`
- **Production URL**: [modula-app.vercel.com](https://modula-app.vercel.com)
- **Automatic Deployment**: When you push to the `main` branch, Vercel automatically triggers a new deployment.
- **Manual Deployment**: You can perform a manual production deployment using the Vercel CLI.

### Manual CLI Workflow

1. **Authentication**:
   ```bash
   npx vercel login leoruas@gmail.com
   ```
   *Follow the email/device authorization instructions.*

2. **Build & Deploy**:
   ```bash
   npm run build
   npx vercel --prod --yes
   ```

### Checking Vercel Deployment

To view the deployment URL and status:

1. Visit the [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the `modula` project
3. Check the latest deployment status and URL

Since Vercel deploys automatically on git push, after running this deploy skill and pushing your commits (including the changelog update), Vercel will deploy the same version automatically. Manual deployment is useful for immediate updates without a Git push.

---
*Note: This skill handles Firebase deployment manually. Vercel deployment happens automatically via git integration.*
