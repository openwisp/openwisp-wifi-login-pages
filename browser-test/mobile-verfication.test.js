import {until, By} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
  urls,
  initialData,
  initializeData,
  tearDown,
  getPhoneToken,
  successToastSelector,
} from "./utils";

const fillPhoneField = async (driver, data) => {
  async function fillField() {
    const username = await driver.wait(
      until.elementLocated(By.css("input#username")),
    );
    await driver.wait(until.elementIsVisible(username));
    await username.sendKeys(data.phoneNumber);
  }
  try {
    await fillField();
  } catch (err) {
    // Stale Reference Error due to DOM reload by PhoneInput Field
    await new Promise((r) => setTimeout(r, 1000));
    await fillField();
  }
};

describe("Selenium tests for <MobileVerification />", () => {
  let driver;

  beforeAll(async () => {
    await initializeData("mobileVerification");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should test mobile verification flow (with one failed attempt and successful attempt)", async () => {
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    const password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.password);
    await fillPhoneField(driver, data);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    const successToastDiv = await getElementByCss(driver, successToastSelector);
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await driver.getCurrentUrl()).toEqual(
      urls.mobileVerification(data.organization),
    );
    expect(await successToastDiv.getText()).toEqual("Login successful");
    driver.navigate().refresh();
    let codeInput = await getElementByCss(driver, "input#code");
    await driver.wait(until.elementIsVisible(codeInput));
    codeInput.sendKeys("123456");
    submitBtn = await getElementByCss(driver, "button[type='submit']");
    await driver.wait(until.elementIsVisible(submitBtn));
    submitBtn.click();
    const failureToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(failureToastDiv));
    expect(await failureToastDiv.getText()).toEqual("Invalid code.");
    driver.navigate().refresh();
    const token = getPhoneToken();
    codeInput = await getElementByCss(driver, "input#code");
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
  });
});
