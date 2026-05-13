const fs = require('fs');
const path = './app/_utils/localization.ts';

let content = fs.readFileSync(path, 'utf8');

// The objects for new translations
const replaceRegex = /const catalogs: Record<LanguageCode, Record<string, string>> = \{[\s\S]*?\}/;

// But first we need to add our dictionaries above `catalogs`
// Let's replace the whole file since it's cleaner.
