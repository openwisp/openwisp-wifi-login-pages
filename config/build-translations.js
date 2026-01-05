/*
 * It converts PO files (i18n/*.po) to JSON files (client/translations/*.json) i.e.:
 * <languageCode>.po -> <languageCode>.json
 * <languageCode>.custom.po -> <languageCode>.json
 * <orgSlug_languageCode>.custom.po -> <orgSlug_languageCode>.json
 * Custom po files will override default translation files.
 */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const childProcess = require("child_process");

const rootDir = process.cwd();
const i18nDir = path.join(rootDir, "i18n");
const translationDir = path.join(path.join(rootDir, "client"), "translations");

const deepMerge = (initialObject, customObject) =>
  _.merge(initialObject, customObject);

const getCustomFiles = (allFiles, translationFile) => {
  const customFile = `${path.basename(translationFile, ".po")}.custom.po`;
  return allFiles.filter((file) => file.indexOf(customFile) !== -1);
};

const poToObject = (file) => {
  let result = {};
  try {
    result = childProcess.execSync(
      `npx ttag po2json ${path.join(i18nDir, file)}`,
    );
  } catch (err) {
    console.error(err);
    return result;
  }
  return JSON.parse(result.toString("utf-8"));
};

const writeTranslationFile = (fileName, object) => {
  try {
    fs.writeFileSync(
      path.join(translationDir, fileName),
      JSON.stringify(object, null, 2),
    );
  } catch (err) {
    console.log(err);
  }
};

if (fs.existsSync(translationDir)) {
  fs.rmSync(translationDir, {recursive: true});
}
if (!fs.existsSync(translationDir))
  fs.mkdirSync(translationDir, {recursive: true});
const allFiles = fs.readdirSync(i18nDir);
const translationFiles = allFiles.filter(
  (file) => file.indexOf("custom") === -1 && path.extname(file) === ".po",
);
translationFiles.forEach((file) => {
  const translation = poToObject(file);
  const fileName = `${path.basename(file, ".po")}`;
  let updatedTranslation = {};
  const customFiles = getCustomFiles(allFiles, file);
  if (customFiles.includes(`${fileName}.custom.po`)) {
    customFiles.splice(customFiles.indexOf(`${fileName}.custom.po`), 1);
    updatedTranslation = deepMerge(
      translation,
      poToObject(`${fileName}.custom.po`),
    );
    writeTranslationFile(`${fileName}.json`, updatedTranslation);
    if (customFiles.length > 0) {
      customFiles.forEach((orgFile) => {
        writeTranslationFile(
          `${path.basename(orgFile, ".po")}.json`,
          deepMerge(updatedTranslation, poToObject(orgFile)),
        );
      });
    }
  } else {
    customFiles.forEach((orgFile) => {
      writeTranslationFile(
        `${path.basename(orgFile, ".po")}.json`,
        deepMerge(translation, poToObject(orgFile)),
      );
    });
    writeTranslationFile(`${fileName}.json`, translation);
  }
});
