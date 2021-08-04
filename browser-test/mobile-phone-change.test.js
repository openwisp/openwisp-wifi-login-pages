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

describe("Selenium tests for <MobilePhoneChange />", () => {
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

  it("should test mobile phone change flow", async () => {
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    const username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.phoneNumber);
    const password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.password);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    let successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await driver.getCurrentUrl()).toEqual(
      urls.mobileVerification(data.organization),
    );
    expect(await successToastDiv.getText()).toEqual("Login successful");
    let codeInput = await getElementByCss(driver, "input#code");
    await driver.wait(until.elementIsVisible(codeInput));
    const token = getPhoneToken();
    codeInput.sendKeys(token);
    submitBtn = await getElementByCss(driver, "button[type='submit']");
    await driver.wait(until.elementIsVisible(submitBtn));
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    let activeSessionTr = await getElementByCss(
      driver,
      "table tr.active-session",
    );
    await driver.wait(until.elementIsVisible(activeSessionTr));
    await driver.get(urls.mobilePhoneChange(data.organization));
    const phoneField = await getElementByCss(
      driver,
      "input[name='phone_number']",
    );
    await driver.wait(until.elementIsVisible(phoneField));
    phoneField.click();
    await phoneField.clear();
    await phoneField.sendKeys("9876543210");
    submitBtn = await getElementByCss(driver, "input[type='submit']");
    await driver.wait(until.elementIsVisible(submitBtn));
    submitBtn.click();
    successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual(
      "SMS verification code sent successfully.",
    );
    const newToken = getPhoneToken();
    codeInput = await getElementByCss(driver, "input#code");
    await driver.wait(until.elementIsVisible(codeInput));
    codeInput.sendKeys(newToken);
    submitBtn = await getElementByCss(driver, "button[type='submit']");
    submitBtn.click();
    await getElementByCss(driver, "div#status");
    const emailElement = await getElementByCss(
      driver,
      "div > p:nth-child(5) > span",
    );
    expect(await emailElement.getText()).toEqual(data.email);
    const phoneElement = await getElementByCss(
      driver,
      "div > p:nth-child(7) > span",
    );
    expect(await phoneElement.getText()).toEqual("+919876543210");
    await driver.wait(until.urlContains("status"), 5000);
    activeSessionTr = await getElementByCss(driver, "table tr.active-session");
    await driver.wait(until.elementIsVisible(activeSessionTr));
  });
});
