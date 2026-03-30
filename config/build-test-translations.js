const fs = require("fs");

const path = require("path");

const childProcess = require("child_process");

const rootDir = process.cwd();
const i18nDir = path.join(rootDir, "i18n");
const outputFile = path.join(rootDir, "client", "test-translation.json");

function poToObject(file) {

  try {
    const result = childProcess.execSync(`npx ttag po2json "${path.join(i18nDir, file)}"`
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

  const enFile = poFiles.find((file) => path.basename(file, ".po") === "en");
  const selectedFile = enFile || poFiles[0];


  if (!selectedFile) {
    console.error("Error: no .po files found in i18n directory");
    process.exit(1);

  }


  const output = poToObject(selectedFile);

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`Generated ${outputFile}`);

}



buildTestTranslations();