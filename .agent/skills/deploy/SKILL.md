---
name: Deploy Skill
description: Automates the build, git tagging, changelog generation, and deployment to Firebase Hosting.
---

# Deploy Skill

This skill governs the deployment lifecycle of the Modula application, managing redundancy between **Firebase Hosting** (static fallback) and **Vercel** (Next.js optimized).

## 1. Dual-Platform Strategy: Why?

We maintain two deployment targets to balance reliability with performance:
- **Vercel (Primary)**: The native home for Next.js. It handles server-side features, edge functions, and automatic performance optimizations that simple static hosting cannot.
- **Firebase Hosting (Fallback)**: Used for static asset delivery and as a reliable fallback. Because it requires a static export (`output: 'export'`), it forces us to maintain a clean, static-compatible routing architecture.

### Routing Strategy
To ensure both platforms serve identical content, we use **query parameters** (e.g., `/editor?projectId=...`) instead of dynamic segments. This is mandatory for Next.js static exports.

## 2. Version Tracking & History

Every deployment MUST be traceable. The `npm run deploy` script automatically handles this by:

1.  **Git Tagging**: Creates a unique `deploy-YYYY-MM-DDTHH-mm-ss` tag for the release.
2.  **Technical Log**: Updates `docs/CHANGELOG.md` with the new deployment entry and its constituent commits.
3.  **Audit Trail**: Commits the updated changelog back to the repo.

## 3. Account & Project Mapping

Strict adherence to these accounts is required to avoid permission errors or deploying to the wrong environment.

### Firebase (Modula Project)
- **Account**: `leo.ruas@ifmg.edu.br` ✅
- **Alternate (DO NOT USE)**: `leoruas@gmail.com` (Used for personal projects)

### Vercel (Modula-App Project)
- **Account**: `leoruas@gmail.com`
- **Project Name**: `modula-app` ✅
- **Production URL**: [modula-app.vercel.app](https://modula-app.vercel.app)
- **Note**: Ensure the local environment is linked to `modula-app`. A secondary `modula` project exists but is not the primary target.

## 3. Strict Protocol

1. **Approval**: Deployment is critical. Only deploy after user confirmation of build status.
2. **Clean State**: All changes must be committed before execution.
3. **Verification**: Always run `npm run build` locally before pushing to production.

## 4. Workflows

### Vercel (Production)
Since automatic git-based deployment has proven unreliable, we now enforce **Manual CLI Deployment** via the deploy script. This guarantees:
1.  The deployed code exactly matches the local build.
2.  Immediate feedback on deployment success/failure.
3.  No "pending" states or sync delays.

The script runs `npx vercel --prod --yes` automatically.

### Manual (Vercel CLI)
Use this if the automated sync is delayed or if you need to bypass the Git flow for immediate testing.

1. **Authentication**:
   ```bash
   npx vercel login leoruas@gmail.com
   ```
2. **Relink (If out of sync)**:
   ```bash
   npx vercel link --project modula-app
   ```
3. **Deploy**:
   ```bash
   npm run build
   npx vercel --prod --yes
   ```

## 5. Troubleshooting Sync Issues

If you push to GitHub but Vercel doesn't update (e.g., still showing "Initial Commit"):
1. **Check the Link**: Run `npx vercel project ls` to see which project is active.
2. **Check the Target**: Ensure you are not accidentally deploying to the `modula` project instead of `modula-app`.
3. **Manual Override**: Run the **Manual CLI Workflow** above to force the current local state to production.

---
*Note: The primary deployment script is located at `.agent/skills/deploy/exec-deploy.js` and handles the Firebase/Tagging logic.*
