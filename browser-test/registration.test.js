import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
  urls,
  initialData,
  tearDown,
  initializeData,
} from "./utils";

describe("Selenium tests for <Register />", () => {
  let driver;

  beforeAll(async () => {
    await initializeData("register");
    driver = await getDriver();
  }, 30000);

  afterEach(async () => {
    await driver.manage().deleteAllCookies();
  });

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should render registration page and submit registration form", async () => {
    await driver.get(urls.registration);
    const data = initialData();
    const username = await getElementByCss(driver, "input#email");
    username.sendKeys(data.testuser.email);

    const password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.testuser.password);

    const confirmPassword = await getElementByCss(
      driver,
      "input#password-confirm",
    );
    confirmPassword.sendKeys(data.testuser.password);

    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();

    await getElementByCss(driver, "div#status");
    const successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual("Registration success");
  });

  it("should render modal tos", async () => {
    await driver.get(urls.registrationTos);
    const h1 = await getElementByCss(driver, "div.message h1");
    await driver.wait(until.elementIsVisible(h1));
    expect(await h1.getText()).toEqual("Terms and Conditions");
  });

  it("should render modal privacy", async () => {
    await driver.get(urls.registrationPrivacy);
    const h1 = await getElementByCss(driver, "div.message h1");
    await driver.wait(until.elementIsVisible(h1));
    expect(await h1.getText()).toEqual("Privacy Policy");
  });
});
