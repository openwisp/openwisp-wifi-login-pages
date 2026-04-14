import {
  getDriver,
  getElementsByCss,
  urls,
  tearDown,
  initialData,
  baseUrl,
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
    expect(scriptSources.includes(`${baseUrl}/${jsFile}`)).toEqual(true);
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    scriptSources = [];
    scripts = await getElementsByCss(driver, "script");
    await Promise.all(
      scripts.map(async (script) => {
        scriptSources.push(await script.getAttribute("src"));
      }),
    );
    expect(scriptSources.includes(`${baseUrl}/${jsFile}`)).toEqual(true);
  });

  it("should serve the extra js file with correct content type", async () => {
    const jsFile = initialData().allOrgScript;
    const result = await driver.executeScript(
      `return fetch("/${jsFile}").then(r => ({
        status: r.status,
        contentType: r.headers.get('content-type'),
      }))`,
    );
    expect(result.status).toEqual(200);
    expect(result.contentType).toEqual(expect.stringContaining("javascript"));
  });
});
