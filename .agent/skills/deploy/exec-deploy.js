const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
    console.log(`> ${cmd}`);
    try {
        return execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Error executing: ${cmd}`);
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 Starting deployment process...');

    // 1. Build project
    console.log('📦 Building project...');
    run('npm run build');

    // 2. Create Tag
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const tagName = `deploy-${timestamp}`;
    console.log(`🏷️ Creating tag: ${tagName}`);
    run(`git tag ${tagName}`);

    // 3. Update Changelog
    console.log('📝 Updating changelog...');
    run('npm run changelog');

    // 4. Commit Changelog (if changed)
    console.log('💾 Committing changelog updates...');
    try {
        run('git add docs/CHANGELOG.md');
        run(`git commit -m "docs(changelog): update for deployment ${tagName}"`);
    } catch (e) {
        console.log('No changelog changes to commit.');
    }

    // 5. Deploy to Firebase
    console.log('🔥 Deploying to Firebase...');
    run('firebase deploy --only hosting');

    // 6. Deploy to Vercel (Manual/CLI Override)
    console.log('▲ Deploying to Vercel (Production)...');
    // Using --yes to skip confirmation and --prod for production deployment
    // We strictly use modula-app project as defined in SKILL.md
    run('npx vercel --prod --yes --token $VERCEL_TOKEN || npx vercel --prod --yes');

    console.log('✅ Deployment successful!');
    console.log(`Version Tag: ${tagName}`);
}

main();
