import {getDriver, getElementByCss, urls, initialData, tearDown} from "./utils";

describe("Selenium tests for <Login />", () => {
  let driver;

  beforeAll(async () => {
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should render login page and submit login form", async () => {
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    // browser preferred language
    let username = await getElementByCss(driver, "input#password");
    let placeholder = await username.getAttribute("placeholder");
    expect(placeholder).toEqual("password");
    let helpdesk = await getElementByCss(
      driver,
      "#login > div > div > div > div:nth-child(2) > span",
    );
    expect(await helpdesk.getText()).toEqual("Helpdesk:");
    // italian language
    const itLangBtn = await getElementByCss(
      driver,
      "button.header-language-btn.header-desktop-language-btn.header-language-btn-it",
    );
    await itLangBtn.click();
    username = await getElementByCss(driver, "input#password");
    placeholder = await username.getAttribute("placeholder");
    expect(placeholder).toEqual("inserisca la password");
    helpdesk = await getElementByCss(
      driver,
      "#login > div > div > div > div:nth-child(2) > span",
    );
    expect(await helpdesk.getText()).toEqual("Supporto:");
    // english language
    const enLangBtn = await getElementByCss(
      driver,
      "button.header-language-btn.header-desktop-language-btn.header-language-btn-en",
    );
    await enLangBtn.click();
    username = await getElementByCss(driver, "input#password");
    placeholder = await username.getAttribute("placeholder");
    expect(placeholder).toEqual("password");
    helpdesk = await getElementByCss(
      driver,
      "#login > div > div > div > div:nth-child(2) > span",
    );
    expect(await helpdesk.getText()).toEqual("Helpdesk:");
  });
});
