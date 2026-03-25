/* eslint-disable no-console */
const {execSync} = require("child_process");
const fs = require("fs");
const path = require("path");

const enPoFile = path.resolve(__dirname, "../i18n/en.po");
const outputFile = path.resolve(__dirname, "../client/test-translation.json");

// Convert the .po file to JSON format using ttag
let result;
try {
  result = execSync(`npx ttag po2json "${enPoFile}"`, {encoding: "utf-8"});
} catch (err) {
  console.error(
    `Failed to generate test-translation.json from ${enPoFile}:`,
    err.message,
  );
  process.exit(1);
}

// Write the result to test-translation.json
fs.writeFileSync(outputFile, result, "utf-8");
console.log("test-translation.json generated successfully.");
