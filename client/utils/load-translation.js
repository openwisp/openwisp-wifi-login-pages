import {addLocale, useLocale} from "ttag";

const setLocale = (language, translationObj) => {
  addLocale(language, translationObj);
  useLocale(language);
};

const loadCustomTranslation = (orgSlug, language) =>
  import(`../translations/${orgSlug}_${language}.custom.json`);
const loadDefaultTranslation = (language) =>
  import(`../translations/${language}.json`);

const loadTranslation = async (language, orgSlug) => {
  if (language !== "") {
    try {
      const {default: translationObj} = await loadCustomTranslation(
        orgSlug,
        language,
      );
      setLocale(language, translationObj);
    } catch (err) {
      const {default: translationObj} = await loadDefaultTranslation(language);
      setLocale(language, translationObj);
    }
  }
};

export default loadTranslation;
