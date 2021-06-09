import {Builder, By, until} from "selenium-webdriver";
import {getDriver, getElementByXPath, urls, initialData} from "./utils";

const firefox = require("selenium-webdriver/firefox");

describe("Selenium tests for <Login />", () => {
  let driver;
  beforeAll(async () => {
    driver = await getDriver(Builder, new firefox.Options().headless());
  });

  afterAll(async () => {
    driver.close();
  });

  it("should render login page and submit login form", async () => {
    const data = initialData();
    await driver.get(urls.login);

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
      "/html/body/div[1]/div[2]/div[3]/div/form/div[4]/input",
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
