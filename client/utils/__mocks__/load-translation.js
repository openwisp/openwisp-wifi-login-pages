import {addLocale, useLocale} from "ttag";
import translation from "../../test-translation.json";

const getCustom = (customObject) => ({
  headers: {
    "content-type": "text/plain; charset=utf-8",
    "plural-forms": "nplurals = 2; plural = (n != 1);",
    language: "en",
    "mime-version": "1.0",
    "content-transfer-encoding": "8bit",
  },
  translations: {
    "": customObject,
  },
});

const loadTranslation = (language, orgSlug, custom = {}) => {
  if (language !== "") {
    if (Object.keys(custom).length >= 1) {
      addLocale(language, getCustom(custom));
      useLocale(language);
    } else {
      addLocale(language, translation);
      useLocale(language);
    }
  }
};

export default loadTranslation;
