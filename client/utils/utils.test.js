import authenticate from "./authenticate";
import customMerge from "./custom-merge";
import renderAdditionalInfo from "./render-additional-info";

describe("renderAdditionalInfo tests", () => {
  let textObj = {en: "sample test"};
  const language = "en";
  const termsAndConditions = {title: {en: "title1"}};
  const privacyPolicy = {title: {en: "title2"}};
  const orgSlug = "default";
  const component = "test";
  it("should return expected output", () => {
    let output = renderAdditionalInfo(
      textObj,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      component,
    );
    expect(output[0]).toEqual("sample test");
    textObj = {en: "sample {terms_and_conditions} test"};
    output = renderAdditionalInfo(
      textObj,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      component,
    );
    expect(output[1].props.children).toBe("title1");
    textObj = {en: "sample {privacy_policy} test"};
    output = renderAdditionalInfo(
      textObj,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      component,
    );
    expect(output[1].props.children).toBe("title2");
    textObj = {en: "sample {privacy_policy} test {terms_and_conditions}"};
    output = renderAdditionalInfo(
      textObj,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      component,
    );
    expect(output[1].props.children).toBe("title2");
    expect(output[3].props.children).toBe("title1");

    textObj = {en: "{terms_and_conditions} sample {privacy_policy} test"};
    output = renderAdditionalInfo(
      textObj,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      component,
    );
    expect(output[1].props.children).toBe("title1");
    expect(output[3].props.children).toBe("title2");
  });
});
describe("customMerge tests", () => {
  const arr1 = ["test1", "test2"];
  const arr2 = ["test3", "test4"];
  it("should return expected output", () => {
    expect(customMerge(arr1, arr2)).toEqual(arr2);
  });
});
describe("authenticate tests", () => {
  const cookies = {
    get: jest
      .fn()
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false),
  };
  const orgSlug = "test-org";
  it("should perform authentication", () => {
    expect(authenticate(cookies, orgSlug)).toEqual(true);
    expect(authenticate(cookies, orgSlug)).toEqual(false);
  });
});
