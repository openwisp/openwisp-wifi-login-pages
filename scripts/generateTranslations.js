const fs = require("fs");

const languages = ["en", "de", "es", "fur", "it", "ru", "sl"];

let allTranslations = {};

languages.forEach((lang) => {
  const poData = fs.readFileSync(`i18n/${lang}.po`, "utf-8");

  let lines = poData.split("\n");

  let translations = {};
  let currentId = "";

  lines.forEach(line => {
    if (line.startsWith("msgid")) {
      currentId = line.replace('msgid "', '').replace('"', '').trim();
    }

    if (line.startsWith("msgstr")) {
      const value = line.replace('msgstr "', '').replace('"', '').trim();

      if (currentId) {
        translations[currentId] = {
          msgid: currentId,
          msgstr: [value]
        };
      }
    }
  });

  allTranslations[lang] = {
    charset: "utf-8",
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "plural-forms": "nplurals = 2; plural = (n != 1);",
      language: lang, // ✅ dynamic
      "mime-version": "1.0",
      "content-transfer-encoding": "8bit"
    },
    translations: {
      "": translations
    }
  };
});

// ✅ write only once
fs.writeFileSync(
  "client/test-translation.json",
  JSON.stringify(allTranslations, null, 2)
);

console.log("✅ All languages JSON generated!");