import {By, until} from "selenium-webdriver";
import {
  baseUrl,
  getDriver,
  getElementByCss,
  initializeData,
  tearDown,
} from "./utils";
import {validateApiUrl} from "../client/constants";

describe("login continuation browser integration", () => {
  let driver;
  let fixtures;
  const assertIdentity = async (username) => {
    const response = await driver.executeAsyncScript((url, done) => {
      const sessionToken = window.sessionStorage.getItem("default_auth_token");
      const cookie = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("default_auth_token="));
      const token =
        sessionToken ||
        (cookie && decodeURIComponent(cookie.split("=").slice(1).join("=")));
      // The rendered page is the same for any logged in user, so the stored
      // token is validated to check which user is actually authenticated.
      fetch(url, {
        method: "POST",
        headers: {"content-type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
          token: token || "",
          session: String(Boolean(sessionToken)),
        }).toString(),
      })
        .then(async (result) => {
          const data = await result.json();
          done({
            status: result.status,
            username: data.username,
            code: data.response_code,
          });
        })
        .catch(() => done({status: 0}));
    }, validateApiUrl("default"));
    expect(response).toEqual({
      status: 200,
      username,
      code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
    });
  };
  const waitForContinuationCleared = () =>
    driver.wait(
      async () =>
        driver.executeScript(
          "return window.sessionStorage.getItem('ow_continuation') === null;",
        ),
      10000,
    );
  const loginUrl = (token, destination) =>
    `${baseUrl}/default/login?${new URLSearchParams({sesame: token, next: destination})}`;
  const passwordLogin = async (account, destination) => {
    await driver.get(
      `${baseUrl}/default/login?${new URLSearchParams({next: destination})}`,
    );
    await (await getElementByCss(driver, "#username")).sendKeys(account.email);
    await driver.findElement(By.css("#password")).sendKeys(account.password);
    await driver.findElement(By.css('input[type="submit"]')).click();
  };
  // The captive portal mock login creates the accounting session shown
  // in the status page, which proves the captive portal login was done.
  const assertPortalSession = async () => {
    await driver.get(`${baseUrl}/default/status`);
    await driver.wait(
      until.elementIsVisible(
        await getElementByCss(driver, "table tr.active-session"),
      ),
      10000,
    );
  };

  beforeAll(async () => {
    driver = await getDriver();
  }, 30000);

  beforeEach(async () => {
    fixtures = await initializeData("continuation", true);
    await driver.get(`${baseUrl}/default/login`);
  }, 30000);

  afterEach(async () => {
    await driver.executeScript("window.sessionStorage.clear()");
    await driver.executeScript("window.localStorage.clear()");
    await driver.manage().deleteAllCookies();
  });

  afterAll(async () => {
    await tearDown(driver);
  });

  it("fresh SESAME continuation to change password", async () => {
    const account = fixtures.testuser;
    await driver.get(loginUrl(account.token, "/default/change-password"));
    await getElementByCss(driver, "#password-change");
    await waitForContinuationCleared();
    const url = new URL(await driver.getCurrentUrl());
    expect(url.pathname).toBe("/default/change-password");
    expect(url.search).toBe("");
    await assertIdentity(account.username);
    await assertPortalSession();
  });

  it("ordinary login continuation", async () => {
    const account = fixtures.testuser;
    await passwordLogin(account, "/default/change-password");
    await getElementByCss(driver, "#password-change");
    await waitForContinuationCleared();
    const url = new URL(await driver.getCurrentUrl());
    expect(url.pathname).toBe("/default/change-password");
    expect(url.search).toBe("");
    await assertIdentity(account.username);
    await assertPortalSession();
  });

  it("does not forward credential-bearing destinations", async () => {
    const account = fixtures.testuser;
    await driver.get(
      loginUrl(account.token, "/default/change-password?token=secret"),
    );
    await getElementByCss(driver, "#status");
    expect(new URL(await driver.getCurrentUrl()).pathname).toBe(
      "/default/status",
    );
    expect((await driver.getCurrentUrl()).includes("secret")).toBe(false);
    await assertIdentity(account.username);
  });

  it("invalid continuation fallback", async () => {
    const account = fixtures.testuser;
    await driver.get(loginUrl(account.token, "https://example.com"));
    await getElementByCss(driver, "#status");
    expect(new URL(await driver.getCurrentUrl()).origin).toBe(baseUrl);
    await assertIdentity(account.username);
  });

  it("expired password takes precedence over continuation", async () => {
    const account = fixtures.expiredPasswordUser;
    await passwordLogin(account, "/default/status");
    await getElementByCss(driver, "#password-change");
    await waitForContinuationCleared();
    const warningToast = await getElementByCss(
      driver,
      ".Toastify__toast--warning",
    );
    await driver.wait(
      until.elementTextContains(warningToast, "Your password has expired"),
      10000,
    );
    expect(new URL(await driver.getCurrentUrl()).pathname).toBe(
      "/default/change-password",
    );
    await assertIdentity(account.username);
  });

  it("ignores continuation and SESAME token of logged in users", async () => {
    const account = fixtures.testuser;
    await passwordLogin(account, "/default/status");
    await getElementByCss(driver, "#status");
    await waitForContinuationCleared();
    await assertPortalSession();
    await driver.get(
      loginUrl(fixtures.expiredPasswordUser.token, "/default/change-password"),
    );
    await getElementByCss(driver, "#status");
    expect(new URL(await driver.getCurrentUrl()).pathname).toBe(
      "/default/status",
    );
    await waitForContinuationCleared();
    await assertIdentity(account.username);
  });
});
