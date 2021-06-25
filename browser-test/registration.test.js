import {Builder, By, until} from "selenium-webdriver";
import {
  getDriver,
  getElementByXPath,
  urls,
  initialData,
  clearData,
  initializeData,
} from "./utils";

const firefox = require("selenium-webdriver/firefox");

describe("Selenium tests for <Register />", () => {
  let driver;
  beforeAll(async () => {
    await initializeData("register");
    driver = await getDriver(Builder, new firefox.Options().headless());
  });

  afterAll(async () => {
    await clearData();
    driver.close();
  });

  it("should render registration page and submit registration form", async () => {
    await driver.get(urls.registration);
    const data = initialData();
    const username = await getElementByXPath(
      driver,
      "//INPUT[@id='email']",
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

    const confirmPassword = await getElementByXPath(
      driver,
      "//INPUT[@id='password-confirm']",
      until,
      By,
    );
    confirmPassword.sendKeys(data.testuser.password);

    const submitBtn = await getElementByXPath(
      driver,
      "//INPUT[@type='submit']",
      until,
      By,
    );
    submitBtn.click();

    await getElementByXPath(driver, "//DIV[@id='status']", until, By);
    const successToastDiv = await getElementByXPath(
      driver,
      "//DIV[@role='alert']",
      until,
      By,
    );
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 10000);
    expect(await successToastDiv.getText()).toEqual("Registration success");
  });
});
