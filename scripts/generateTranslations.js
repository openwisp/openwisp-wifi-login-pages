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

const parseQuoted = (raw, lineNum) => {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse quoted string at line ${lineNum}: ${raw}\nOriginal error: ${err.message}`,
    );
  }
};

const flushEntry = () => {
  if (currentId) {
    // ✅ FIX: fallback to msgid if msgstr empty
    const finalMsgstr =
      currentMsgstr.length && currentMsgstr.some((s) => s && s.trim() !== "")
        ? currentMsgstr
        : [currentId];

    translations[currentId] = {
      msgid: currentId,
      msgstr: finalMsgstr,
    };
  }

  currentId = null;
  currentMsgstr = [];
  activeField = null;
  activeIndex = 0;
};

lines.forEach((rawLine, idx) => {
  const line = rawLine.trim();
  const lineNum = idx + 1; // for parseQuoted

  if (!line) {
    flushEntry();
    return; // replaces continue
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
