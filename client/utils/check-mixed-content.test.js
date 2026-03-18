import checkMixedContent from "./check-mixed-content";

describe("checkMixedContent", () => {
  it("should throw on http action from https page", () => {
    expect(() => checkMixedContent("http://example.com", "https:")).toThrow(
      "Mixed Content",
    );
  });

  it("should not throw on https action from https page", () => {
    expect(() =>
      checkMixedContent("https://example.com", "https:"),
    ).not.toThrow();
  });

  it("should not throw on http action from http page", () => {
    expect(() =>
      checkMixedContent("http://example.com", "http:"),
    ).not.toThrow();
  });

  it("should not throw if actionUrl is missing or invalid", () => {
    expect(() => checkMixedContent(null, "https:")).not.toThrow();
    expect(() => checkMixedContent(undefined, "https:")).not.toThrow();
  });
});
