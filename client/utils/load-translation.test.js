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
  beforeEach(() => {
    consoleError = jest.fn();
    consoleLog = jest.fn();
    console.error = consoleError;
    console.log = consoleLog;
    languages = jest.spyOn(navigator, "languages", "get");
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should load translation", async () => {
    await loadTranslation("en", "default");
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
    expect(consoleError.mock.calls.length).toBe(0);
    expect(consoleLog.mock.calls.length).toBe(0);
  });
  it("should give error if language JSON file does not exists and must use default language", async () => {
    await loadTranslation("hi", "default");
    expect(consoleError.mock.calls.length).toBe(1);
    expect(consoleError).toHaveBeenCalledWith("Error in loading translations.");
    expect(consoleLog.mock.calls.length).toBe(1);
    expect(consoleLog).toHaveBeenCalledWith(
      "Cannot found translation for this language. Using default language.",
    );
  });
  it("should use language code if sub language code is not found", async () => {
    languages.mockReturnValue(["en-US", "en-GB", "en"]);
    await loadTranslation("hi", "default", true, [
      {slug: "en"},
      {slug: "it"},
      {slug: "hi"},
    ]);
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
  });
});
