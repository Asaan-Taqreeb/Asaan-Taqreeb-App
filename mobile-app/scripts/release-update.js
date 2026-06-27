const fs = require('fs');
const path = require('path');

const mobileAppRoot = path.join(__dirname, '..');
const backendRoot = path.join(mobileAppRoot, '..', '..', 'Asaan-taqreeb-backend');
const mobileAppJsonPath = path.join(mobileAppRoot, 'app.json');
const mobilePackageJsonPath = path.join(mobileAppRoot, 'package.json');
const backendUpdateJsonPath = path.join(backendRoot, 'app-update.json');

const args = process.argv.slice(2);

const getFlagValue = (flagName) => {
  const index = args.indexOf(flagName);
  if (index === -1) return null;
  return args[index + 1] || null;
};

const hasFlag = (flagName) => args.includes(flagName);

const version = getFlagValue('--version');
const apkUrl = getFlagValue('--apk-url');
const releaseNotes = getFlagValue('--release-notes') || '';
const forceUpdate = hasFlag('--force-update');

if (!version || !apkUrl) {
  console.error('Usage: node scripts/release-update.js --version <x.y.z> --apk-url <url> [--release-notes "..."] [--force-update]');
  process.exit(1);
}

const updateJsonFile = (filePath, updater) => {
  const current = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const next = updater(current);
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`);
};

updateJsonFile(mobileAppJsonPath, (appJson) => {
  if (!appJson.expo) {
    throw new Error('mobile app.json is missing expo configuration');
  }

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      version,
    },
  };
});

updateJsonFile(mobilePackageJsonPath, (packageJson) => ({
  ...packageJson,
  version,
}));

updateJsonFile(backendUpdateJsonPath, (updateJson) => ({
  ...updateJson,
  latestVersion: version,
  apkUrl,
  forceUpdate,
  releaseNotes,
}));

console.log('Release metadata updated successfully.');
console.log(`Version: ${version}`);
console.log(`APK URL: ${apkUrl}`);
console.log(`Force update: ${forceUpdate ? 'yes' : 'no'}`);
