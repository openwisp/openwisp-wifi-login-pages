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
const lines = poData.split(/\r?\n/);

// Parse translations
const translations = {};

let currentId = null;
let currentMsgstr = [];
let activeField = null; // "msgid" | "msgstr" | null
let activeIndex = 0;

// Parse quoted string with error context
const parseQuoted = (raw, lineNum) => {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse quoted string at line ${lineNum}: ${raw}\nOriginal error: ${err.message}`,
    );
  }
};

// Flush current entry to translations
const flushEntry = () => {
  if (currentId !== null) {
    translations[currentId] = {
      msgid: currentId,
      msgstr: currentMsgstr.length ? currentMsgstr : [""],
    };
  }
  currentId = null;
  currentMsgstr = [];
  activeField = null;
  activeIndex = 0;
};

// Process each line
lines.forEach((rawLine, idx) => {
  const line = rawLine.trim();
  const lineNum = idx + 1; // for error messages

  if (!line) {
    flushEntry();
    return;
  }

  if (/^msgid\s+/.test(line)) {
    flushEntry();
    currentId = parseQuoted(line.replace(/^msgid\s+/, ""), lineNum);
    activeField = "msgid";
    return;
  }

  const msgstrMatch = line.match(/^msgstr(?:\[(\d+)\])?\s+(.*)$/);
  if (msgstrMatch) {
    activeField = "msgstr";
    activeIndex = msgstrMatch[1] ? Number(msgstrMatch[1]) : 0;
    currentMsgstr[activeIndex] = parseQuoted(msgstrMatch[2], lineNum);
    return;
  }

  if (line.startsWith('"')) {
    const chunk = parseQuoted(line, lineNum);
    if (activeField === "msgid" && currentId !== null) {
      currentId += chunk;
    } else if (activeField === "msgstr") {
      currentMsgstr[activeIndex] = (currentMsgstr[activeIndex] || "") + chunk;
    }
  }
});

// Flush any remaining entry
flushEntry();

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
fs.writeFileSync(outputFilePath, `${JSON.stringify(finalJSON, null, 2)}\n`);

// eslint-disable-next-line no-console
console.log("✅ JSON generated!");
