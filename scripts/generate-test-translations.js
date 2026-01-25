const fs = require('fs');

// Read .po file
const poFile = fs.readFileSync('./i18n/en.po', 'utf8');
const lines = poFile.split('\n');

// Object to store translations
const translations = {
  charset: 'utf-8',
  headers: {
    'content-type': 'text/plain; charset=utf-8',
    'plural-forms': 'nplurals = 2; plural = (n != 1);',
    language: 'en',
    'mime-version': '1.0',
    'content-transfer-encoding': '8bit'
  },
  translations: {
    '': {}
  }
};

let currentMsgid = null;
let currentMsgstr = null;
let isCollectingMsgstr = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmedLine = line.trim();
  
  // Skip comments
  if (trimmedLine.startsWith('#')) continue;
  
  // Empty line - save current pair if complete
  if (!trimmedLine) {
    if (currentMsgid && currentMsgstr !== null) {
      translations.translations[''][currentMsgid] = {
        msgid: currentMsgid,
        msgstr: [currentMsgstr]
      };
    }
    currentMsgid = null;
    currentMsgstr = null;
    isCollectingMsgstr = false;
    continue;
  }
  
  // Extract msgid
  if (trimmedLine.startsWith('msgid "')) {
    currentMsgid = trimmedLine.substring(7, trimmedLine.length - 1);
    isCollectingMsgstr = false;
    continue;
  }
  
  // Start of msgstr (could be empty multi-line)
  if (trimmedLine.startsWith('msgstr "')) {
    isCollectingMsgstr = true;
    // Check if it's single line or multi-line
    if (trimmedLine.endsWith('"') && trimmedLine.length > 8) {
      // Single line
      currentMsgstr = trimmedLine.substring(8, trimmedLine.length - 1);
    } else {
      // Multi-line starting
      currentMsgstr = "";
    }
    continue;
  }
  
  // Continue collecting multi-line msgstr
  if (isCollectingMsgstr && line.trim().startsWith('"')) {
    const content = line.trim().substring(1, line.trim().length - 1);
    currentMsgstr += content;
    continue;
  }
}

// Save last pair
if (currentMsgid && currentMsgstr !== null) {
  translations.translations[''][currentMsgid] = {
    msgid: currentMsgid,
    msgstr: [currentMsgstr]
  };
}

// Write to file
const outputPath = './client/test-translation.json';
fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));

console.log('Generated:', outputPath);
console.log('Translations count:', Object.keys(translations.translations['']).length);

// Verify LOGIN_ADD_INFO is included
if (translations.translations['']['LOGIN_ADD_INFO_TXT']) {
  console.log('✓ LOGIN_ADD_INFO_TXT found');
} else {
  console.log('✗ LOGIN_ADD_INFO_TXT missing');
}