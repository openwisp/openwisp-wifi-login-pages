import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByXPath,
  urls,
  initialData,
  initializeData,
  clearData,
} from "./utils";

describe("Selenium tests for <Login />", () => {
  let driver;

  beforeAll(async () => {
    initializeData();
    driver = await getDriver();
  }, 30000);

  afterAll(() => {
    clearData();
    driver.close();
  });

  it("should render login page and submit login form", async () => {
    await driver.get(urls.login);
    const data = initialData();
    const username = await getElementByXPath(driver, "//INPUT[@id='username']");
    username.sendKeys(data.testuser.email);

    const password = await getElementByXPath(driver, "//INPUT[@id='password']");
    password.sendKeys(data.testuser.password);

    const submitBtn = await getElementByXPath(
      driver,
      "//INPUT[@type='submit']",
    );
    submitBtn.click();

    await getElementByXPath(driver, "//DIV[@id='status']");
    const emailElement = await getElementByXPath(driver, "(//SPAN)[2]");
    expect(await emailElement.getText()).toEqual(data.testuser.email);

    const successToastDiv = await getElementByXPath(
      driver,
      "//DIV[@role='alert']",
    );
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual("Login successful");
  });
});
