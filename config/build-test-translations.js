const fs = require("fs");

const path = require("path");

const childProcess = require("child_process");

const rootDir = process.cwd();
const i18nDir = path.join(rootDir, "i18n");
const outputFile = path.join(rootDir, "client", "test-translation.json");

function poToObject(file) {
    
  try {
    const result = childProcess.execSync(
      `npx ttag po2json "${path.join(i18nDir, file)}"`,
    );
    return JSON.parse(result.toString("utf-8"));
  } catch (err) {
    console.error(`Error while converting ${file}:`, err.message);
    return {};
  }
}

function isBasePoFile(file) {

  return path.extname(file) === ".po" && !file.includes(".custom.po");
}

function buildTestTranslations() {

  const allFiles = fs.readdirSync(i18nDir);
  const poFiles = allFiles.filter(isBasePoFile);

  const output = {};

  poFiles.forEach((file) => {

    const lang = path.basename(file, ".po");
    output[lang] = poToObject(file);
  });

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`Generated ${outputFile}`);
}

buildTestTranslations();