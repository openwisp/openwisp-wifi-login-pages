import {Builder, By, until} from "selenium-webdriver";
import {getDriver, getElementByXPath, urls} from "./utils";

const firefox = require("selenium-webdriver/firefox");

describe("Selenium tests for <Register />", () => {
  let driver;
  beforeAll(async () => {
    jest.setTimeout(30000);
    driver = await getDriver(Builder, new firefox.Options().headless());
  });

  afterAll(async () => {
    driver.close();
  });

  it("should render registration page and submit registration form", async () => {
    await driver.get(urls.registration);

    const username = await getElementByXPath(
      driver,
      "//INPUT[@id='email']",
      until,
      By,
    );
    username.sendKeys(
      `${Math.random().toString(36).substring(7)}@openwisp.org`,
    );

    const password = await getElementByXPath(
      driver,
      "//INPUT[@id='password']",
      until,
      By,
    );
    password.sendKeys("test_password");

    const confirmPassword = await getElementByXPath(
      driver,
      "//INPUT[@id='password-confirm']",
      until,
      By,
    );
    confirmPassword.sendKeys("test_password");

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
