const fs = require("fs");

const poData = fs.readFileSync("i18n/en.po", "utf-8");

const lines = poData.split("\n");

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

fs.writeFileSync(
  "client/test-translation.json",
  JSON.stringify(finalJSON, null, 2),
);

console.log("✅ JSON generated!");
