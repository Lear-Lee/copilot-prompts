// fetch_latest_config.js
// This script fetches the latest prompts markdown files from the GitHub repository
// and writes them into the extension's prompts directory before packaging.

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration: repository and target directory
const REPO_OWNER = 'ForLear';
const REPO_NAME = 'copilot-prompts';
const BRANCH = 'main'; // adjust if needed
const PROMPTS_DIR = path.join(__dirname, 'src', 'prompts'); // destination inside extension

// List of directories to fetch (relative to repo root)
const PROMPT_SUBDIRS = ['agents', 'common', 'industry', 'vue'];

function fetchFile(filePath) {
    return new Promise((resolve, reject) => {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${filePath}`;
        https.get(url, res => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${filePath}: ${res.statusCode}`));
                return;
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ filePath, content: data }));
        }).on('error', reject);
    });
}

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function main() {
    console.log('Fetching latest prompts from GitHub...');
    await ensureDir(PROMPTS_DIR);
    for (const subdir of PROMPT_SUBDIRS) {
        const localSubdir = path.join(PROMPTS_DIR, subdir);
        await ensureDir(localSubdir);
        // Fetch file list via GitHub API (simple approach: known filenames)
        // For simplicity, we fetch all .md files in the subdir using the raw URL pattern.
        // In a real scenario, you might query the repo tree API.
        const knownFiles = {
            agents: ['vitasage.agent.md', 'vue3.agent.md', 'typescript.agent.md', 'i18n.agent.md'],
            common: [],
            industry: [],
            vue: []
        }[subdir] || [];
        for (const file of knownFiles) {
            const remotePath = `${subdir}/${file}`;
            try {
                const { content } = await fetchFile(remotePath);
                const localPath = path.join(localSubdir, file);
                fs.writeFileSync(localPath, content, 'utf8');
                console.log(`✔ ${remotePath} -> ${localPath}`);
            } catch (e) {
                console.warn(`⚠️ Skipped ${remotePath}: ${e.message}`);
            }
        }
    }
    console.log('Fetch completed.');
}

main().catch(err => {
    console.error('Error during fetch:', err);
    process.exit(1);
});
