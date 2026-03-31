/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const rootDir = process.cwd();
const i18nDir = path.join(rootDir, "i18n");
const outputFile = path.join(rootDir, "client", "test-translation.json");
// eslint-disable-next-line consistent-return
function poToObject(file) {
  const ttagBinary = path.join(
    rootDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "ttag.cmd" : "ttag",
  );

  try {
    const result = childProcess.execSync(
      `"${ttagBinary}" po2json "${path.join(i18nDir, file)}"`,
    );
    return JSON.parse(result.toString("utf-8"));
  } catch (err) {
    console.error(`Error while converting ${file}:`, err.message);
    process.exit(1);
  }
}

function isBasePoFile(file) {
  return path.extname(file) === ".po" && !file.includes(".custom.po");
}

function buildTestTranslations() {
  const allFiles = fs.readdirSync(i18nDir);
  const poFiles = allFiles.filter(isBasePoFile);

  const enFile = poFiles.find((file) => path.basename(file, ".po") === "en");

  if (!enFile) {
    console.error("Error: en.po not found in i18dirn ectory");
    process.exit(1);
  }

  const output = poToObject(enFile);

  fs.writeFileSync(outputFile, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Generated ${outputFile}`);
}

buildTestTranslations();
