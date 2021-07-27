import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
  urls,
  initialData,
  initializeData,
  clearData,
} from "./utils";

describe("Selenium tests for <PasswordReset />", () => {
  let driver;

  beforeAll(async () => {
    initializeData();
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    clearData();
    await driver.manage().deleteAllCookies();
    driver.close();
  });

  it("should show not found on password confirm", async () => {
    await driver.get(urls.passwordConfirm("uid", "token"));
    const data = initialData();
    const password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.testuser.password);
    const passwordConfirm = await getElementByCss(
      driver,
      "input#password-confirm",
    );
    passwordConfirm.sendKeys(data.testuser.password);
    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    const successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual("Not found.");
  });
});
