import {
  getDriver,
  getElementsByCss,
  urls,
  tearDown,
  initialData,
} from "./utils";

describe("Selenium tests to check JS file injection in organization page", () => {
  let driver;

  beforeAll(async () => {
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should load js file for entire application", async () => {
    const jsFile = initialData().allOrgScript;
    await driver.get(urls.login);
    let scriptSources = [];
    let scripts = await getElementsByCss(driver, "script");
    await Promise.all(
      scripts.map(async (script) => {
        scriptSources.push(await script.getAttribute("src"));
      }),
    );
    expect(scriptSources.includes(`http://0.0.0.0:8080/${jsFile}`)).toEqual(
      true,
    );
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    scriptSources = [];
    scripts = await getElementsByCss(driver, "script");
    await Promise.all(
      scripts.map(async (script) => {
        scriptSources.push(await script.getAttribute("src"));
      }),
    );
    expect(scriptSources.includes(`http://0.0.0.0:8080/${jsFile}`)).toEqual(
      true,
    );
  });
});
