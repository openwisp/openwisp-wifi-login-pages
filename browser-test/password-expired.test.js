import {By, until} from "selenium-webdriver";
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
    await username.sendKeys(data.expiredPasswordUser.email);
    let password = await getElementByCss(driver, "input#password");
    await password.sendKeys(data.expiredPasswordUser.password);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    await driver.wait(until.urlContains("change-password"), 5000);
    let successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(
      until.elementTextContains(successToastDiv, "Login successful"),
      10000,
    );
    expect(await successToastDiv.getText()).toEqual("Login successful");
    const warningToastMessage = await getElementByCss(
      driver,
      ".Toastify__toast--warning",
    );
    await driver.wait(until.elementIsVisible(warningToastMessage));
    await driver.wait(
      until.elementTextContains(
        warningToastMessage,
        "Your password has expired",
      ),
      10000,
    );
    expect(await warningToastMessage.getText()).toEqual(
      "Your password has expired, please update it.",
    );

    const warningBox = await getElementByCss(
      driver,
      "#password-expired-warning",
    );
    await driver.wait(until.elementIsVisible(warningBox));
    expect(await warningBox.getText()).toEqual(
      "Your password has expired, please update it.",
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
    await currPassword.sendKeys(data.expiredPasswordUser.password);
    const newPassword = "newPassword@";
    const changePassword = await getElementByCss(driver, "input#new-password");
    await changePassword.sendKeys(newPassword);
    const changePasswordConfirm = await getElementByCss(
      driver,
      "input#password-confirm",
    );
    await changePasswordConfirm.sendKeys(newPassword);
    submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    await getElementByCss(driver, "div#status");
    successToastDiv = await getElementByCss(driver, successToastSelector);
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(
      until.elementTextContains(successToastDiv, "Password updated"),
      10000,
    );
    expect(await successToastDiv.getText()).toEqual(
      "Password updated successfully",
    );

    // login with new password
    await driver.manage().deleteAllCookies();
    await driver.get(urls.login);
    await driver.wait(until.urlContains("login"), 5000);
    username = await getElementByCss(driver, "input#username");
    await username.sendKeys(data.expiredPasswordUser.email);
    password = await getElementByCss(driver, "input#password");
    await password.sendKeys(newPassword);
    submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    await getElementByCss(driver, "div#status");
    successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(
      until.elementTextContains(successToastDiv, "Login successful"),
      10000,
    );
    expect(await successToastDiv.getText()).toEqual("Login successful");
  });
});

describe("Selenium tests for expired password logout />", () => {
  let driver;

  beforeAll(async () => {
    await initializeData("expiredPassword");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should allow logout from change-password page when password is expired", async () => {
    await driver.get(urls.login);
    const data = initialData();
    const username = await getElementByCss(driver, "input#username");
    await username.sendKeys(data.expiredPasswordUser.email);
    const password = await getElementByCss(driver, "input#password");
    await password.sendKeys(data.expiredPasswordUser.password);
    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    await driver.wait(until.urlContains("change-password"), 5000);

    await getElementByCss(driver, "#password-expired-warning");
    await driver.wait(async () => {
      const loaders = await driver.findElements(
        By.css(".loader-container.full"),
      );
      const visibleLoaders = await Promise.all(
        loaders.map((loader) => loader.isDisplayed().catch(() => false)),
      );
      return !visibleLoaders.includes(true);
    }, 10000);
    const logoutButton = await getElementByCss(driver, ".row.logout button");
    await driver.wait(until.elementIsVisible(logoutButton));
    await logoutButton.click();

    // Logout redirects via status, then to login when unauthenticated
    await driver.wait(until.urlContains("login"), 10000);
    await getElementByCss(driver, "input#username");
    await getElementByCss(driver, "input#password");
    // Re-query toast each poll so SPA redirects do not leave a stale reference
    await driver.wait(async () => {
      const toasts = await driver.findElements(By.css(successToastSelector));
      if (!toasts.length) {
        return false;
      }
      try {
        return (await toasts[0].getText()).includes("Logout successful");
      } catch (err) {
        return false;
      }
    }, 10000);
  });
});
