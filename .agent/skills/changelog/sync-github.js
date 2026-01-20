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
    console.log('📤 Starting GitHub Sync process...');

    // 1. Check for uncommitted changes
    const status = execSync('git status --porcelain').toString().trim();
    if (status) {
        console.log('⚠️ There are uncommitted changes. Please commit or stash them first.');
        process.exit(1);
    }

    // 2. Create Sync Tag
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const tagName = `sync-${timestamp}`;
    console.log(`🏷️ Creating sync tag: ${tagName}`);
    run(`git tag ${tagName}`);

    // 3. Update Changelog
    console.log('📝 Updating changelog...');
    run('npm run changelog');

    // 4. Commit Changelog
    console.log('💾 Committing changelog updates...');
    try {
        run('git add docs/CHANGELOG.md');
        run(`git commit -m "docs(changelog): sync update ${tagName}"`);
    } catch (e) {
        console.log('No changelog changes to commit.');
    }

    // 5. Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    run('git push origin main');
    run(`git push origin ${tagName}`);

    console.log('✅ Sync successful!');
    console.log(`Sync Tag: ${tagName}`);
}

main();
