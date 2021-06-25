import {Builder, By, until} from "selenium-webdriver";
import {
  getDriver,
  getElementByXPath,
  urls,
  initialData,
  initializeData,
  clearData,
} from "./utils";

const firefox = require("selenium-webdriver/firefox");

describe("Selenium tests for <Login />", () => {
  let driver;
  beforeAll(async () => {
    await initializeData();
    driver = await getDriver(Builder, new firefox.Options().headless());
  }, 30000);

  afterAll(async () => {
    await clearData();
    driver.close();
  });

  it("should render login page and submit login form", async () => {
    await driver.get(urls.login);
    const data = initialData();
    const username = await getElementByXPath(
      driver,
      "//INPUT[@id='username']",
      until,
      By,
    );
    username.sendKeys(data.testuser.email);

    const password = await getElementByXPath(
      driver,
      "//INPUT[@id='password']",
      until,
      By,
    );
    password.sendKeys(data.testuser.password);

    const submitBtn = await getElementByXPath(
      driver,
      "//INPUT[@type='submit']",
      until,
      By,
    );
    submitBtn.click();

    await getElementByXPath(driver, "//DIV[@id='status']", until, By);
    const emailElement = await getElementByXPath(
      driver,
      "(//SPAN)[2]",
      until,
      By,
    );
    expect(await emailElement.getText()).toEqual(data.testuser.email);

    const successToastDiv = await getElementByXPath(
      driver,
      "//DIV[@role='alert']",
      until,
      By,
    );
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 10000);
    expect(await successToastDiv.getText()).toEqual("Login successful");
  });
});
