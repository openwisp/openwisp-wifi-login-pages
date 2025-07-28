/*
 * It converts PO files (i18n/*.po) to test-translation.json format for testing purposes.
 * This script automatically generates client/test-translation.json from the English .po file
 * to ensure test translations are always up-to-date with the source translations.
 */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const i18nDir = path.join(rootDir, "i18n");
const testTranslationFile = path.join(rootDir, "client", "test-translation.json");


const parsePoFile = (filePath) => {
  console.log("Reading file:", filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  const translations = { "": {} };
  let currentMsgid = null;
  let currentMsgstr = null;
  let state = null; // "msgid", "msgstr", or null

  const saveTranslation = () => {
    if (currentMsgid !== null && currentMsgstr !== null) {
      translations[""][currentMsgid] = currentMsgstr;
    }
    currentMsgid = null;
    currentMsgstr = null;
    state = null;
  };

  for (let line of lines) {
    line = line.trim();

    if (line === "" || line.startsWith("#")) {
      // End of a block, so save if we have data
      if (currentMsgid !== null && currentMsgstr !== null) {
        saveTranslation();
      }
      continue;
    }

    if (line.startsWith("msgid")) {
      if (currentMsgid !== null && currentMsgstr !== null) {
        saveTranslation();
      }
      currentMsgid = line.substring(5).trim().replace(/^"|"$/g, "");
      state = "msgid";
    } else if (line.startsWith("msgstr")) {
      currentMsgstr = line.substring(6).trim().replace(/^"|"$/g, "");
      state = "msgstr";
    } else if (line.startsWith('"')) {
      const text = line.replace(/^"|"$/g, "");
      if (state === "msgid" && currentMsgid !== null) {
        currentMsgid += text;
      } else if (state === "msgstr" && currentMsgstr !== null) {
        currentMsgstr += text;
      }
    }
  }

  // Final entry at EOF
  if (currentMsgid !== null && currentMsgstr !== null) {
    saveTranslation();
  }

  return translations;
};


const convertToTestFormat = (poTranslations) => {
  const headers = {
    "content-type": "text/plain; charset=utf-8",
    "plural-forms": "nplurals = 2; plural = (n != 1);",
    "language": "en",
    "mime-version": "1.0",
    "content-transfer-encoding": "8bit"
  };

  const testTranslations = { "": {} };

  // Handle translations in the default context
  const contextTranslations = poTranslations[""];
  Object.keys(contextTranslations).forEach((msgid) => {
    const msgstr = contextTranslations[msgid];

    if (msgid === "") {
      // Header block
      testTranslations[""][""] = {
        msgid: "",
        msgstr: [msgstr]
      };
    } else {
      // Regular translations
      testTranslations[""][msgid] = {
        msgid: msgid,
        msgstr: [msgstr]
      };
    }
  });

  return {
    charset: "utf-8",
    headers: headers,
    translations: testTranslations
  };
};

const buildTestTranslation = () => {
  console.log("Building test-translation.json from .po files...");
  
  // Check if i18n directory exists
  if (!fs.existsSync(i18nDir)) {
    console.error("i18n directory not found!");
    process.exit(1);
  }

  // Get all .po files
  const allFiles = fs.readdirSync(i18nDir);
  const poFiles = allFiles.filter(
    (file) => file.indexOf("custom") === -1 && path.extname(file) === ".po"
  );

  if (poFiles.length === 0) {
    console.error("No .po files found in i18n directory!");
    process.exit(1);
  }

  // Use English .po file as the base for test translations
  const englishPoFile = poFiles.find(file => file === "en.po");
  if (!englishPoFile) {
    console.error("English .po file (en.po) not found!");
    process.exit(1);
  }

  console.log(`Converting ${englishPoFile} to test format...`);
  
  // Parse PO file directly
  const poFilePath = path.join(i18nDir, englishPoFile);
  const poTranslations = parsePoFile(poFilePath);
  console.log(poTranslations);
  
  // Convert to test format
  const testTranslation = convertToTestFormat(poTranslations);
  
  // Write the test translation file
  try {
    fs.writeFileSync(
      testTranslationFile,
      JSON.stringify(testTranslation, null, 2)
    );
    console.log(`Successfully generated ${testTranslationFile}`);
  } catch (err) {
    console.error("Error writing test-translation.json:", err);
    process.exit(1);
  }
};

// Run the script if called directly
if (require.main === module) {
  buildTestTranslation();
}

module.exports = { buildTestTranslation }; 