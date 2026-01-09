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

    // Wait for page to be fully loaded and stable
    await driver.sleep(1000);

    let scriptSources = [];
    // Re-fetch scripts to avoid stale element reference
    let scripts = await getElementsByCss(driver, "script");

    // Get all script sources in a single pass to avoid iterating over potentially stale elements
    scriptSources = await Promise.all(
      scripts.map(async (script) => {
        try {
          return await script.getAttribute("src");
        } catch (error) {
          // If element becomes stale, return null and filter it out
          return null;
        }
      }),
    );

    // Filter out null values from stale elements
    scriptSources = scriptSources.filter((src) => src !== null);

    expect(scriptSources.includes(`http://127.0.0.1:8080/${jsFile}`)).toEqual(
      true,
    );

    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));

    // Wait for page to be fully loaded and stable after navigation
    await driver.sleep(1000);

    scriptSources = [];
    // Re-fetch scripts after navigation to get fresh element references
    scripts = await getElementsByCss(driver, "script");

    // Get all script sources in a single pass
    scriptSources = await Promise.all(
      scripts.map(async (script) => {
        try {
          return await script.getAttribute("src");
        } catch (error) {
          // If element becomes stale, return null and filter it out
          return null;
        }
      }),
    );

    // Filter out null values from stale elements
    scriptSources = scriptSources.filter((src) => src !== null);

    expect(scriptSources.includes(`http://127.0.0.1:8080/${jsFile}`)).toEqual(
      true,
    );
  });
});
