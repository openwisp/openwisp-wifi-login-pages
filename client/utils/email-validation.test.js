import {
  DEFAULT_EMAIL_PATTERN,
  getEmailTypoSuggestion,
  getSafeEmailPattern,
} from "./email-validation";

describe("email validation utilities", () => {
  it("should replace legacy email regex patterns", () => {
    expect(getSafeEmailPattern(".+@.+\\..+")).toEqual(DEFAULT_EMAIL_PATTERN);
    expect(getSafeEmailPattern(".+@.+..+")).toEqual(DEFAULT_EMAIL_PATTERN);
    expect(getSafeEmailPattern()).toEqual(DEFAULT_EMAIL_PATTERN);
  });

  it("should keep custom email regex patterns", () => {
    const customPattern = "^[^@]+@example\\.com$";
    expect(getSafeEmailPattern(customPattern)).toEqual(customPattern);
  });

  it("should return a suggestion for common email domain typos", () => {
    expect(getEmailTypoSuggestion("tester@gmal.com")).toEqual(
      "tester@gmail.com",
    );
    expect(getEmailTypoSuggestion("tester@gmail.com")).toBeNull();
  });
});
