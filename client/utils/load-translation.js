import {addLocale, useLocale} from "ttag";
/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const loadTranslation = (language, orgSlug) => {
  let translationObj = {};
  if (language !== "") {
    try {
      translationObj = require(`../translations/${orgSlug}_${language}.custom.json`);
    } catch (err) {
      translationObj = require(`../translations/${language}.json`);
    }
    addLocale(language, translationObj);
    useLocale(language);
  }
};

export default loadTranslation;
