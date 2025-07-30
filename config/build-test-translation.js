// convert-po-to-json.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const inputPo = path.join(rootDir, 'i18n/en.po');
const finalOutput = path.join(rootDir, 'client/test-translation.json');

try {
  const rawOutput = execSync(`npx ttag po2json "${inputPo}"`, { encoding: 'utf-8' });

  const parsed = JSON.parse(rawOutput);
  fs.writeFileSync(finalOutput, JSON.stringify(parsed, null, 2), 'utf-8');

  console.log('Translation to json successful');
} catch (err) {
  console.error('Translation generation failed:', err.message);
}
