const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'CHANGELOG.md');

// Map conventional commit types to readable headers
const TYPE_MAP = {
    feat: '✨ New Features',
    feature: '✨ New Features',
    fix: '🐛 Bug Fixes',
    perf: '⚡ Performance',
    revert: '⏪ Reverts',
    docs: '📝 Documentation',
    style: '💄 Styles',
    chore: '🔧 Chores',
    refactor: '♻️ Refactoring',
    test: '✅ Tests',
    build: '👷 Build System',
    ci: '💚 CI',
};

function getCommits(from, to) {
    const range = from ? `${from}..${to || 'HEAD'}` : to || 'HEAD';
    // %H: hash, %s: subject, %an: author name, %ai: author date, ISO 8601-like format
    const cmd = `git log ${range} --pretty=format:"%H|%s|%an|%ai"`;
    try {
        const output = execSync(cmd).toString().trim();
        if (!output) return [];
        return output.split('\n').map(line => {
            const [hash, subject, author, date] = line.split('|');
            return { hash, subject, author, date };
        });
    } catch (error) {
        console.warn(`Could not get commits for range ${range}:`, error.message);
        return [];
    }
}

function parseCommit(commit) {
    // Regex for "type(scope): message" or "type: message"
    const match = commit.subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (!match) {
        return { type: 'other', scope: null, message: commit.subject, ...commit };
    }
    const [, type, scope, message] = match;
    return { type: type.toLowerCase(), scope, message, ...commit };
}

function isPublicRelease(tag) {
    // Matches v1.0.0, v2.3.4 (strict semver with v prefix, no pre-release suffix)
    return /^v\d+\.\d+\.\d+$/.test(tag);
}

function isDeployment(tag) {
    return tag.startsWith('deploy-');
}

function isSync(tag) {
    return tag.startsWith('sync-') || tag.startsWith('push-');
}

function generateReleaseEntry(version, date, commits) {
    if (commits.length === 0 && version !== 'Unreleased') return '';

    // Determine release type
    const isPublic = version === 'Unreleased' || isPublicRelease(version);
    const isDeploy = isDeployment(version);
    const isGithubSync = isSync(version);

    let releaseIcon = '🚧 ';
    if (isPublic) releaseIcon = '🏆 ';
    if (isDeploy) releaseIcon = '🚀 ';
    if (isGithubSync) releaseIcon = '📤 ';

    const headerLevel = '###';
    const versionDisplay = `${releaseIcon}${version}`;

    let md = `${headerLevel} ${versionDisplay} (${date})\n\n`;

    if (isDeploy) {
        md += `> **Deployment**: Version sent to production environments.\n\n`;
    } else if (isGithubSync) {
        md += `> **GitHub Sync**: Changes pushed to the remote repository.\n\n`;
    } else if (!isPublic) {
        md += `> **Tracking Version**: Technical snapshot or internal tag.\n\n`;
    }

    const groups = {};

    // Group commits by type
    commits.forEach(raw => {
        const parsed = parseCommit(raw);
        const typeKey = TYPE_MAP[parsed.type] ? parsed.type : 'other';
        if (!groups[typeKey]) groups[typeKey] = [];
        groups[typeKey].push(parsed);
    });

    // Order of types to display
    const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'chore', 'other'];
    const knownTypes = Object.keys(TYPE_MAP);

    // Add any types found that aren't in explicit order to the end, before 'other'
    Object.keys(groups).forEach(t => {
        if (!typeOrder.includes(t) && t !== 'other') {
            typeOrder.splice(typeOrder.length - 1, 0, t);
        }
    });

    typeOrder.forEach(type => {
        if (!groups[type]) return;

        // For tracking versions, maybe use smaller headers or bold list items to save space?
        // keeping consistent for now, but using h3/h4 based on parent
        const subHeaderLevel = isPublic ? '###' : '####';
        const header = TYPE_MAP[type] || 'Other Changes';
        md += `${subHeaderLevel} ${header}\n\n`;

        groups[type].forEach(c => {
            const scopePrefix = c.scope ? `**${c.scope}:** ` : '';
            // Format date: 2024-05-20 14:30:05 -0300 -> 2024-05-20 14:30
            const shortDate = c.date ? c.date.substring(0, 16) : '';
            md += `- ${scopePrefix}${c.message} ([${c.hash.substring(0, 7)}](https://github.com/leorruas/modula/commit/${c.hash})) - *${shortDate}*\n`;
        });
        md += '\n';
    });

    return md;
}

function main() {
    console.log('Generating CHANGELOG...');

    let tags = [];
    try {
        tags = execSync('git tag --sort=-creatordate').toString().trim().split('\n').filter(t => t);
    } catch (e) {
        console.warn('No tags found or error listing tags.');
    }

    let changelogContent = '# Changelog\n\nAll notable changes to this project will be documented in this file.\nThis file documents technical activity, including GitHub pushes (`📤 sync-*`) and production deployments (`🚀 deploy-*`).\n\n';

    // 1. Unreleased (HEAD -> Last Tag)
    const lastTag = tags.length > 0 ? tags[0] : null;
    const unreleasedCommits = getCommits(lastTag, null);
    if (unreleasedCommits.length > 0) {
        changelogContent += generateReleaseEntry('Unreleased', new Date().toISOString().split('T')[0], unreleasedCommits);
    }

    // 2. Tagged Versions
    for (let i = 0; i < tags.length; i++) {
        const currentTag = tags[i];
        const prevTag = tags[i + 1] || null; // null means start of history

        // Get date of the tag
        let tagDate = '';
        try {
            tagDate = execSync(`git log -1 --format=%ad --date=short ${currentTag}`).toString().trim();
        } catch (e) { }

        const commits = getCommits(prevTag, currentTag);
        changelogContent += generateReleaseEntry(currentTag, tagDate, commits);
    }

    // Ensure docs dir exists
    const docsDir = path.dirname(CHANGELOG_PATH);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(CHANGELOG_PATH, changelogContent);
    console.log(`Changelog generated at ${CHANGELOG_PATH}`);
}

main();
