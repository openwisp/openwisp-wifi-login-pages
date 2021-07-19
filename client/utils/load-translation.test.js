/* eslint-disable global-require */
import {useLocale, addLocale} from "ttag";
import loadTranslation from "./load-translation";

let translation = {};
try {
  translation = require("../translations/en.json");
} catch (err) {
  translation = require("../test-translation.json");
}
jest.mock("ttag");

describe("Translations tests", () => {
  let consoleError;
  let consoleLog;
  let languages;
  let setLanguage;
  beforeEach(() => {
    consoleError = jest.fn();
    consoleLog = jest.fn();
    console.error = consoleError;
    console.log = consoleLog;
    languages = jest.spyOn(navigator, "languages", "get");
    setLanguage = jest.fn();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should load translation", async () => {
    await loadTranslation("en", "default", "en", setLanguage);
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
    expect(consoleError.mock.calls.length).toBe(0);
    expect(consoleLog.mock.calls.length).toBe(0);
    expect(setLanguage).toHaveBeenCalledWith("en");
  });
  it("should log if language JSON file does not exists and must use default language", async () => {
    await loadTranslation("hi", "default", "en", setLanguage);
    expect(consoleLog.mock.calls.length).toBe(1);
    expect(consoleLog).toHaveBeenCalledWith(
      "Cannot found translation for this language. Using default language.",
    );
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
    expect(setLanguage).toHaveBeenCalledWith("en");
  });
  it("should use language code if sub language code is not found", async () => {
    languages.mockReturnValue(["en-US", "en-GB", "en"]);
    await loadTranslation("hi", "default", "en", setLanguage, true, [
      {slug: "en"},
      {slug: "it"},
      {slug: "hi"},
    ]);
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
    expect(setLanguage).toHaveBeenCalledWith("en");
  });
  it("should give error if default translation is not found", async () => {
    await loadTranslation("hi", "default", "hi", setLanguage);
    expect(consoleError.mock.calls.length).toBe(1);
    expect(consoleError).toHaveBeenCalledWith("Error in loading translations.");
    expect(setLanguage.mock.calls.length).toBe(0);
  });
  it("should load browser language if default language is different", async () => {
    languages.mockReturnValue(["en-US", "en-GB", "en"]);
    await loadTranslation("it", "default", "it", setLanguage, true, [
      {slug: "en"},
      {slug: "it"},
      {slug: "hi"},
    ]);
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
    expect(setLanguage).toHaveBeenCalledWith("en");
  });
});
