import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
  urls,
  initialData,
  initializeData,
  tearDown,
} from "./utils";

describe("Selenium tests for <PasswordChange />", () => {
  let driver;

  beforeAll(async () => {
    await initializeData();
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should change password and login with changed password", async () => {
    // login with original password
    await driver.get(urls.login);
    const data = initialData();
    let username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.testuser.email);
    let password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.testuser.password);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    let successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual("Login successful");

    // changing password
    await driver.get(urls.passwordChange);
    await driver.wait(until.urlContains("change-password"), 5000);
    await getElementByCss(driver, "div#password-change");
    const newPassword = "newPassword@";
    const changePassword = await getElementByCss(driver, "input#password");
    changePassword.sendKeys(newPassword);
    const changePasswordConfirm = await getElementByCss(
      driver,
      "input#password-confirm",
    );
    changePasswordConfirm.sendKeys(newPassword);
    submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual(
      "New password has been saved.",
    );

    // login with new password
    await driver.manage().deleteAllCookies();
    await driver.get(urls.login);
    await driver.wait(until.urlContains("login"), 5000);
    username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.testuser.email);
    password = await getElementByCss(driver, "input#password");
    password.sendKeys(newPassword);
    submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual("Login successful");
  });
});
