const { spawnSync } = require('child_process');
const path = require('path');
const readline = require('readline');
const fs = require('fs');

const mobileAppRoot = path.join(__dirname, '..');
const appJsonPath = path.join(mobileAppRoot, 'app.json');
const currentVersion = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))?.expo?.version || '1.0.0';

const ask = (rl, question, defaultValue = '') => new Promise((resolve) => {
  const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
  rl.question(prompt, (answer) => {
    resolve(answer.trim() || defaultValue);
  });
});

const askYesNo = (rl, question, defaultValue = false) => new Promise((resolve) => {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  rl.question(`${question} [${hint}]: `, (answer) => {
    const normalized = answer.trim().toLowerCase();
    if (!normalized) {
      resolve(defaultValue);
      return;
    }

    resolve(['y', 'yes', 'true', '1'].includes(normalized));
  });
});

const main = async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log('Release update helper');
    console.log(`Current app version: ${currentVersion}`);

    const version = await ask(rl, 'New version', currentVersion);
    const apkUrl = await ask(rl, 'APK download URL');
    const releaseNotes = await ask(rl, 'Release notes', '');
    const forceUpdate = await askYesNo(rl, 'Force update for users', false);

    if (!version || !apkUrl) {
      console.error('Version and APK URL are required.');
      process.exit(1);
    }

    const args = [
      path.join(__dirname, 'release-update.js'),
      '--version', version,
      '--apk-url', apkUrl,
    ];

    if (releaseNotes) {
      args.push('--release-notes', releaseNotes);
    }

    if (forceUpdate) {
      args.push('--force-update');
    }

    const result = spawnSync(process.execPath, args, { stdio: 'inherit' });

    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  } finally {
    rl.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
