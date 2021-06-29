import {useLocale, addLocale} from "ttag";
import translation from "../test-translation.json";
import loadTranslation from "./load-translation";

jest.mock("ttag");
jest.mock("./load-translation");

describe("load translation tests", () => {
  it("should load", () => {
    jest.unmock("./load-translation");
    loadTranslation("en", "default");
    expect(addLocale).toHaveBeenCalledWith("en", translation);
    expect(useLocale).toHaveBeenCalledWith("en");
  });
});
