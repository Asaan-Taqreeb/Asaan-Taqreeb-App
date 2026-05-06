const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'node_modules/react-native-nitro-modules/android/src/main/java/com/margelo/nitro/NitroModulesPackage.kt');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Use a more robust replacement that removes named arguments
  const oldCode = `          canOverrideExistingModule = false,
          needsEagerInit = false,
          isCxxModule = false,
          isTurboModule = isTurboModule,`;
  
  const newCode = `          false,
          false,
          false,
          isTurboModule,`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(targetFile, content);
    console.log('Successfully patched NitroModulesPackage.kt');
  } else {
    console.log('Target code not found in NitroModulesPackage.kt, it might already be patched or changed.');
  }
} else {
  console.log('NitroModulesPackage.kt not found, skipping patch');
}
