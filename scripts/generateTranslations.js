const fs = require("fs");
const path = require("path");

// Use project-root-relative paths for cross-platform safety
const poFilePath = path.join(process.cwd(), "i18n", "en.po");
const outputFilePath = path.join(
  process.cwd(),
  "client",
  "test-translation.json",
);

// Read the PO file
const poData = fs.readFileSync(poFilePath, "utf-8");

// Split lines
const lines = poData.split("\n");

// Parse translations
const translations = {};
let currentId = "";

lines.forEach((line) => {
  if (line.startsWith("msgid")) {
    currentId = line.replace('msgid "', "").replace('"', "").trim();
  }

  if (line.startsWith("msgstr")) {
    const value = line.replace('msgstr "', "").replace('"', "").trim();

    if (currentId) {
      translations[currentId] = {
        msgid: currentId,
        msgstr: [value],
      };
    }
  }
});

// Prepare final JSON
const finalJSON = {
  charset: "utf-8",
  headers: {
    "content-type": "text/plain; charset=utf-8",
    "plural-forms": "nplurals = 2; plural = (n != 1);",
    language: "en",
    "mime-version": "1.0",
    "content-transfer-encoding": "8bit",
  },
  translations: {
    "": translations,
  },
};

// Write output file with trailing newline
fs.writeFileSync(outputFilePath, `${JSON.stringify(finalJSON, null, 2)  }\n`);

console.log("✅ JSON generated!");
