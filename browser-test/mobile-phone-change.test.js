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

describe("Selenium tests for <MobilePhoneChange />", () => {
  let driver;

  beforeAll(async () => {
    // long test in CI
    jest.setTimeout(30000);
    await initializeData("mobileVerification");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should test mobile phone change flow", async () => {
    const data = initialData().mobileVerificationTestUser;
    await driver.get(urls.verificationLogin(data.organization));
    const password = await getElementByCss(driver, "input#password");
    await password.sendKeys(data.password);
    await fillPhoneField(driver, data);
    let submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();
    let successToastDiv = await getElementByCss(driver, successToastSelector);
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
    // fixes ElementClickInterceptedError:
    // Element <input id="phone-number" class="form-control input " name="phone_number" type="tel">
    // is not clickable at point (447,275) because another element
    // <div class="loader-container"> obscures it
    await driver.sleep(250);
    const phoneField = await getElementByCss(
      driver,
      "input[name='phone_number']",
    );
    await driver.wait(until.elementIsVisible(phoneField));
    phoneField.click();
    await phoneField.clear();
    await phoneField.sendKeys(data.changePhoneNumber);
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
    await driver.wait(until.urlContains("status"), 5000);
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
    expect(await phoneElement.getText()).toEqual(
      `+91${data.changePhoneNumber}`,
    );
    activeSessionTr = await getElementByCss(driver, "table tr.active-session");
    await driver.wait(until.elementIsVisible(activeSessionTr));
  });
});
