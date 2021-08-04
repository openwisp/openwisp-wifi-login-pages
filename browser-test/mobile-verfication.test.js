import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
  urls,
  initialData,
  initializeData,
  clearData,
  getPhoneToken,
} from "./utils";

describe("Selenium tests for <MobileVerification />", () => {
  let driver;

  beforeAll(async () => {
    initializeData("mobileVerification");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    clearData();
    await driver.manage().deleteAllCookies();
    driver.close();
  });

  it("should test mobile verification flow (with one failed attempt and successful attempt)", async () => {
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    const username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.phoneNumber);
    const password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.password);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    const successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await driver.getCurrentUrl()).toEqual(
      urls.mobileVerification(data.organization),
    );
    expect(await successToastDiv.getText()).toEqual("Login successful");
    driver.navigate().refresh();
    const codeInput = await getElementByCss(driver, "input#code");
    await driver.wait(until.elementIsVisible(codeInput));
    codeInput.sendKeys("123456");
    submitBtn = await getElementByCss(driver, "button[type='submit']");
    await driver.wait(until.elementIsVisible(submitBtn));
    submitBtn.click();
    const failureToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(failureToastDiv));
    expect(await failureToastDiv.getText()).toEqual("Invalid code.");
    const token = getPhoneToken();
    codeInput.clear();
    codeInput.sendKeys(token);
    submitBtn = await getElementByCss(driver, "button[type='submit']");
    await driver.wait(until.elementIsVisible(submitBtn));
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    const emailElement = await getElementByCss(
      driver,
      "div > p:nth-child(5) > span",
    );
    expect(await emailElement.getText()).toEqual(data.email);
    const phoneElement = await getElementByCss(
      driver,
      "div > p:nth-child(6) > span",
    );
    expect(await phoneElement.getText()).toEqual(data.phoneNumber);
    await driver.wait(until.urlContains("status"), 5000);
    const activeSessionTr = await getElementByCss(
      driver,
      "table tr.active-session",
    );
    await driver.wait(until.elementIsVisible(activeSessionTr));
  });
});
