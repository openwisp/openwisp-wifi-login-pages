import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByXPath,
  urls,
  initialData,
  clearData,
  initializeData,
} from "./utils";

describe("Selenium tests for <Register />", () => {
  let driver;

  beforeAll(async () => {
    initializeData("register");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    clearData();
    driver.close();
  });

  it("should render registration page and submit registration form", async () => {
    await driver.get(urls.registration);
    const data = initialData();
    const username = await getElementByXPath(driver, "//INPUT[@id='email']");
    username.sendKeys(data.testuser.email);

    const password = await getElementByXPath(driver, "//INPUT[@id='password']");
    password.sendKeys(data.testuser.password);

    const confirmPassword = await getElementByXPath(
      driver,
      "//INPUT[@id='password-confirm']",
    );
    confirmPassword.sendKeys(data.testuser.password);

    const submitBtn = await getElementByXPath(
      driver,
      "//INPUT[@type='submit']",
    );
    submitBtn.click();

    await getElementByXPath(driver, "//DIV[@id='status']");
    const successToastDiv = await getElementByXPath(
      driver,
      "//DIV[@role='alert']",
    );
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual("Registration success");
  });
});
