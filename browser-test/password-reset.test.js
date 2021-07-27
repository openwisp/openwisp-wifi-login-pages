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

  it("should send password reset email", async () => {
    await driver.get(urls.passwordReset);
    const data = initialData();
    const email = await getElementByCss(driver, "input#email");
    email.sendKeys(data.testuser.email);
    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    const successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual(
      "Password reset e-mail has been sent.",
    );
  });
});
