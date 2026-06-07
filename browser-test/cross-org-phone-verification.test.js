import {until} from "selenium-webdriver";
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

describe("Selenium tests for cross-organization phone verification", () => {
  let driver;

  beforeAll(async () => {
    await initializeData("crossOrgPhoneVerification");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should login to a new organization and complete phone verification", async () => {
    const data = initialData().crossOrgPhoneVerificationUser;
    await driver.get(urls.verificationLogin(data.targetOrganization));
    const username = await getElementByCss(driver, "input#username");
    await username.sendKeys(data.phoneNumber);
    const password = await getElementByCss(driver, "input#password");
    await password.sendKeys(data.password);
    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    const successToastDiv = await getElementByCss(driver, successToastSelector);
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(
      until.urlContains(
        `/${data.targetOrganization}/mobile-phone-verification`,
      ),
      5000,
    );
    const codeInput = await getElementByCss(driver, "input#code");
    const token = getPhoneToken(data.phoneNumber);
    await codeInput.sendKeys(token);
    const verifyBtn = await getElementByCss(driver, "button[type='submit']");
    await verifyBtn.click();
    await driver.wait(
      until.urlContains(`/${data.targetOrganization}/status`),
      5000,
    );
    const emailElement = await getElementByCss(
      driver,
      "div > p:nth-child(5) > span",
    );
    expect(await emailElement.getText()).toEqual(data.email);
  });
});
