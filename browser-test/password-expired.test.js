import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
  urls,
  initialData,
  initializeData,
  tearDown,
  successToastSelector,
} from "./utils";

describe("Selenium tests for expired password flow />", () => {
  let driver;

  beforeAll(async () => {
    await initializeData("expiredPassword");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should force user to change password before captive portal login", async () => {
    // login with original password
    await driver.get(urls.login);
    const data = initialData();
    let username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.expiredPasswordUser.email);
    let password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.expiredPasswordUser.password);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    await driver.wait(until.urlContains("change-password"), 5000);
    let successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual("Login successful");
    const warningToastMessage = await getElementByCss(
      driver,
      ".Toastify__toast--warning",
    );
    await driver.wait(until.elementIsVisible(warningToastMessage));
    expect(await warningToastMessage.getText()).toEqual(
      "Your password has expired, please change your password.",
    );

    // Try visiting the status page, but the user should redirected
    // back to change password page
    await driver.get(urls.status);
    await driver.wait(until.urlContains("change-password"), 5000);

    // changing password
    await getElementByCss(driver, "div#password-change");
    const currPassword = await getElementByCss(
      driver,
      "input#current-password",
    );
    currPassword.sendKeys(data.expiredPasswordUser.password);
    const newPassword = "newPassword@";
    const changePassword = await getElementByCss(driver, "input#new-password");
    changePassword.sendKeys(newPassword);
    const changePasswordConfirm = await getElementByCss(
      driver,
      "input#password-confirm",
    );
    changePasswordConfirm.sendKeys(newPassword);
    submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    successToastDiv = await getElementByCss(driver, successToastSelector);
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual(
      "Password updated successfully",
    );

    // login with new password
    await driver.manage().deleteAllCookies();
    await driver.get(urls.login);
    await driver.wait(until.urlContains("login"), 5000);
    username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.expiredPasswordUser.email);
    password = await getElementByCss(driver, "input#password");
    password.sendKeys(newPassword);
    submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual("Login successful");
  });
});
