/*
 * Verification script to check if test-translation.json was properly generated
 */
const fs = require("fs");
const path = require("path");

const testTranslationFile = path.join(process.cwd(), "client", "test-translation.json");

const verifyTestTranslation = () => {
  console.log("Verifying test-translation.json...");
  
  if (!fs.existsSync(testTranslationFile)) {
    console.error("❌ test-translation.json not found!");
    return false;
  }

  try {
    const content = JSON.parse(fs.readFileSync(testTranslationFile, "utf8"));
    
    // Check basic structure
    if (!content.translations || !content.headers) {
      console.error("❌ Invalid structure: missing translations or headers");
      return false;
    }

    // Check if we have actual translations (excluding the empty msgid)
    const translations = content.translations[""] || {};
    const translationKeys = Object.keys(translations).filter(key => key !== "");
    const translationCount = translationKeys.length;
    console.log(`✅ Found ${translationCount} translations`);
    
    // Check a few specific translations
    const sampleTranslations = [
      "PWD_REVEAL",
      "PWD_HIDE", 
      "LOGIN",
      "USERNAME"
    ];
    
    let foundCount = 0;
    sampleTranslations.forEach(key => {
      if (translations[key]) {
        console.log(`✅ Found translation for: ${key} -> "${translations[key].msgstr[0]}"`);
        foundCount++;
      } else {
        console.log(`❌ Missing translation for: ${key}`);
      }
    });
    
    if (foundCount === sampleTranslations.length) {
      console.log("✅ All sample translations found!");
      return true;
    } else {
      console.log(`❌ Only ${foundCount}/${sampleTranslations.length} sample translations found`);
      return false;
    }
    
  } catch (err) {
    console.error("❌ Error reading test-translation.json:", err.message);
    return false;
  }
};

if (require.main === module) {
  const success = verifyTestTranslation();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyTestTranslation }; 