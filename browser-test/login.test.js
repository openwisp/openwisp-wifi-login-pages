import {until} from "selenium-webdriver";
import {
  getDriver,
  getElementByCss,
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

  afterAll(async () => {
    clearData();
    await driver.manage().deleteAllCookies();
    driver.close();
  });

  it("should render login page and submit login form", async () => {
    await driver.get(urls.login);
    const data = initialData();
    const username = await getElementByCss(driver, "input#username");
    username.sendKeys(data.testuser.email);

    const password = await getElementByCss(driver, "input#password");
    password.sendKeys(data.testuser.password);

    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    submitBtn.click();

    await getElementByCss(driver, "div#status");
    const emailElement = await getElementByCss(
      driver,
      "div > p:nth-child(5) > span",
    );
    expect(await emailElement.getText()).toEqual(data.testuser.email);

    const successToastDiv = await getElementByCss(driver, "div[role=alert]");
    await driver.wait(until.elementIsVisible(successToastDiv));
    await driver.wait(until.urlContains("status"), 5000);
    expect(await successToastDiv.getText()).toEqual("Login successful");

    const activeSessionTr = await getElementByCss(
      driver,
      "table tr.active-session",
    );
    await driver.wait(until.elementIsVisible(activeSessionTr));
  });
});
