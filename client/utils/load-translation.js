import {addLocale, useLocale} from "ttag";

const setLocale = (language, translationObj) => {
  addLocale(language, translationObj);
  useLocale(language);
};

const loadCustomTranslation = (orgSlug, language) =>
  import(`../translations/${orgSlug}_${language}.custom.json`);
const loadDefaultTranslation = (language) =>
  import(`../translations/${language}.json`);

const importTranslation = async (orgSlug, lang) => {
  try {
    const {default: translationObj} = await loadCustomTranslation(
      orgSlug,
      lang,
    );
    setLocale(lang, translationObj);
  } catch (err) {
    const {default: translationObj} = await loadDefaultTranslation(lang);
    setLocale(lang, translationObj);
  }
};

const loadTranslation = async (language, orgSlug, useBrowserLang = false) => {
  let lang = language;
  if (useBrowserLang) lang = navigator.language || navigator.userLanguage;
  if (lang !== "") {
    try {
      // using user preferred language
      await importTranslation(orgSlug, lang);
    } catch (err) {
      // using default language
      await importTranslation(orgSlug, language);
    }
  }
};

export default loadTranslation;
