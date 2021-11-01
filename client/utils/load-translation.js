import {addLocale, useLocale} from "ttag";

const setLocale = (language, translationObj, setLanguage) => {
  setLanguage(language);
  addLocale(language, translationObj);
  useLocale(language);
};

const loadCustomTranslation = (orgSlug, language) =>
  import(`../translations/${orgSlug}_${language}.custom.json`);
const loadDefaultTranslation = (language) =>
  import(`../translations/${language}.json`);

const importTranslation = async (orgSlug, lang, setLanguage) => {
  try {
    const {default: translationObj} = await loadCustomTranslation(
      orgSlug,
      lang,
    );
    setLocale(lang, translationObj, setLanguage);
  } catch (err) {
    const {default: translationObj} = await loadDefaultTranslation(lang);
    setLocale(lang, translationObj, setLanguage);
  }
};

const loadTranslationUtil = async (
  language,
  orgSlug,
  defaultLanguage,
  setLanguage,
  useBrowserLang,
  availableLanguages,
) => {
  let lang = language;
  if (useBrowserLang) {
    const availLangs = availableLanguages.map((langObj) => langObj.slug);
    (navigator.languages ? navigator.languages : [navigator.language]).some(
      (browserLang) => {
        if (availLangs.includes(browserLang)) lang = browserLang;
        else if (availLangs.includes(browserLang.substr(0, 2)))
          lang = browserLang.substr(0, 2);
        return (
          availLangs.includes(browserLang) ||
          availLangs.includes(browserLang.substr(0, 2))
        );
      },
    );
  }
  if (lang !== "") {
    try {
      // using user preferred language
      await importTranslation(orgSlug, lang, setLanguage);
    } catch (err) {
      // using passed language
      try {
        await importTranslation(orgSlug, language, setLanguage);
      } catch (error) {
        // Using default language of that organization.
        console.log(
          "Cannot found translation for this language. Using default language.",
        );
        await importTranslation(orgSlug, defaultLanguage, setLanguage);
      }
    }
  }
};

const loadTranslation = async (
  language,
  orgSlug,
  defaultLanguage,
  setLanguage,
  useBrowserLang = false,
  availableLanguages = [],
) => {
  try {
    await loadTranslationUtil(
      language,
      orgSlug,
      defaultLanguage,
      setLanguage,
      useBrowserLang,
      availableLanguages,
    );
  } catch (err) {
    console.error("Error in loading translations.");
  }
};

export default loadTranslation;
