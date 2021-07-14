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

const loadTranslationUtil = async (
  language,
  orgSlug,
  useBrowserLang = false,
) => {
  let lang = language;
  if (useBrowserLang) lang = navigator.language || navigator.userLanguage;
  if (lang !== "") {
    try {
      // using user preferred language
      await importTranslation(orgSlug, lang);
    } catch (err) {
      // using passed language
      try {
        await importTranslation(orgSlug, language);
      } catch (error) {
        // Using default language of that organization.
        console.log(
          "Cannot found translation for this language. Using default language.",
        );
        await importTranslation(
          orgSlug,
          localStorage.getItem(`${orgSlug}-defaultLanguage`),
        );
      }
    }
  }
};

const loadTranslation = async (language, orgSlug, useBrowserLang = false) => {
  try {
    await loadTranslationUtil(language, orgSlug, useBrowserLang);
  } catch (err) {
    console.error("Error in loading translations.");
  }
};

export default loadTranslation;
