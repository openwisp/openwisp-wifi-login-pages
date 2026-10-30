import {until} from "selenium-webdriver";
import {
  baseUrl,
  getDriver,
  getElementByCss,
  urls,
  initialData,
  initializeData,
  tearDown,
  successToastSelector,
} from "./utils";

// The marker is lost only when the browser leaves the single page app,
// which proves the captive portal form was submitted in the top-level window.
const setMarker = (driver) =>
  driver.executeScript("window.syncAuthMarker = true");
const waitForMarkerLoss = (driver) =>
  driver.wait(
    async () => !(await driver.executeScript("return window.syncAuthMarker")),
    10000,
  );

describe("Selenium tests for synchronous captive portal authentication", () => {
  let driver;

  beforeAll(async () => {
    await initializeData("syncAuth");
    driver = await getDriver();
  }, 30000);

  afterAll(async () => {
    await tearDown(driver);
  });

  it("should login and logout through the captive portal in the top-level window", async () => {
    const data = initialData().syncAuthTestUser;
    const loginUrl = urls.verificationLogin(data.organization);
    await driver.get(loginUrl);
    await setMarker(driver);
    const username = await getElementByCss(driver, "input#username");
    await username.sendKeys(data.email);
    const password = await getElementByCss(driver, "input#password");
    await password.sendKeys(data.password);
    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    await waitForMarkerLoss(driver);
    await driver.wait(
      until.urlIs(`${baseUrl}/${data.organization}/status`),
      10000,
    );
    const loginForm = await getElementByCss(driver, "#cp-login-form");
    expect(await loginForm.getAttribute("target")).toEqual("_self");
    const loginRedirect = await getElementByCss(
      driver,
      "#cp-login-form input[name=redirurl]",
    );
    expect(await loginRedirect.getAttribute("value")).toEqual(
      `${baseUrl}/${data.organization}/status`,
    );
    const emailElement = await getElementByCss(
      driver,
      "#status .main-column > .inner > p:nth-child(5) > span",
    );
    await driver.wait(until.elementTextIs(emailElement, data.email));
    // the active session is created by the captive portal mock login view
    const activeSessionTr = await getElementByCss(
      driver,
      "table tr.active-session",
    );
    await driver.wait(until.elementIsVisible(activeSessionTr));
    const logoutRedirect = await getElementByCss(
      driver,
      "#cp-logout-form input[name=redirurl]",
    );
    expect(await logoutRedirect.getAttribute("value")).toEqual(
      `${baseUrl}/${data.organization}/status`,
    );
    await setMarker(driver);
    const logoutBtn = await getElementByCss(driver, ".logout input.button");
    await logoutBtn.click();
    const noBtn = await getElementByCss(
      driver,
      ".modal.is-visible .modal-buttons button:nth-child(2)",
    );
    await driver.wait(until.elementIsVisible(noBtn));
    await noBtn.click();
    await waitForMarkerLoss(driver);
    await driver.wait(until.urlIs(loginUrl), 10000);
    const successToastDiv = await getElementByCss(driver, successToastSelector);
    await driver.wait(until.elementIsVisible(successToastDiv));
    expect(await successToastDiv.getText()).toEqual("Logout successful");
  });

  it("should follow the login continuation after the captive portal redirect", async () => {
    const data = initialData().syncAuthTestUser;
    const destination = `/${data.organization}/change-password`;
    await driver.get(
      `${urls.verificationLogin(data.organization)}?${new URLSearchParams({next: destination})}`,
    );
    const username = await getElementByCss(driver, "input#username");
    await username.sendKeys(data.email);
    const password = await getElementByCss(driver, "input#password");
    await password.sendKeys(data.password);
    await setMarker(driver);
    const submitBtn = await getElementByCss(driver, "input[type=submit]");
    await submitBtn.click();
    await waitForMarkerLoss(driver);
    await driver.wait(until.urlIs(`${baseUrl}${destination}`), 10000);
    await getElementByCss(driver, "#password-change");
    expect(
      await driver.executeScript(
        "return window.sessionStorage.getItem('ow_continuation');",
      ),
    ).toEqual(null);
    await driver.get(`${baseUrl}/${data.organization}/status`);
    const activeSessionTr = await getElementByCss(
      driver,
      "table tr.active-session",
    );
    await driver.wait(until.elementIsVisible(activeSessionTr));
  });
});
