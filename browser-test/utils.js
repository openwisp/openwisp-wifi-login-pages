import {Builder, By, until} from "selenium-webdriver";
import {spawnSync} from "child_process";
import testData from "./testData.json";

const chrome = require("selenium-webdriver/chrome");

const waitTime = 5000;
const orgSlug = "default";
export const baseUrl = "http://127.0.0.1:8080";

export const executeCommand = (command, argv, json = false) => {
  const result = spawnSync(command, [argv]);

  if (result.stdout && !json) {
    process.stdout.write(`${result.stdout}\n`);
  }
  if (result.stderr) {
    process.stderr.write(`${result.stderr}\n`);
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
  return json
    ? JSON.parse(result.stdout.toString().trim().split("\n").pop())
    : undefined;
};

export const getDriver = async () => {
  const options = new chrome.Options().setChromeBinaryPath(
    "/home/pandafy/bin/chromium",
  );
  options.addArguments("--no-sandbox", "--disable-dev-shm-usage");
  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(
      process.env.SELENIUM_HEADLESS === "1"
        ? options.addArguments("--headless=new")
        : options,
    )
    .build();
};

export const getElementByCss = async (driver, css) => {
  let el;
  try {
    el = await driver.wait(until.elementLocated(By.css(css)), waitTime);
  } catch (err) {
    console.log(err, css, await driver.getPageSource());
  }
  return el;
};

export const getElementsByCss = async (driver, css) => {
  let el;
  try {
    el = await driver.wait(until.elementsLocated(By.css(css)), waitTime);
  } catch (err) {
    console.log(err, css, await driver.getPageSource());
  }
  return el;
};

export const initialData = () => testData;

export const initializeData = async (argv = null, json = false) =>
  executeCommand(`./browser-test/initialize_data.py`, argv, json);

export const clearData = async () => {
  await executeCommand("./browser-test/clear_data.py", () => {});
};

export const tearDown = async (driver) => {
  await clearData();
  await driver.executeScript("window.sessionStorage.clear()");
  await driver.executeScript("window.localStorage.clear()");
  await driver.manage().deleteAllCookies();
  driver.close();
};

export const getPhoneToken = (phoneNumber) => {
  const result = spawnSync("./browser-test/get_phone_token.py", [phoneNumber]);
  return result.stdout.toString();
};

export const urls = {
  registration: `${baseUrl}/${orgSlug}/registration`,
  registrationTos: `${baseUrl}/${orgSlug}/registration/terms-and-conditions`,
  registrationPrivacy: `${baseUrl}/${orgSlug}/registration/privacy-policy`,
  login: `${baseUrl}/${orgSlug}/login`,
  loginTos: `${baseUrl}/${orgSlug}/login/terms-and-conditions`,
  loginPrivacy: `${baseUrl}/${orgSlug}/login/privacy-policy`,
  status: `${baseUrl}/${orgSlug}/status`,
  passwordChange: `${baseUrl}/${orgSlug}/change-password`,
  passwordReset: `${baseUrl}/${orgSlug}/password/reset`,
  passwordConfirm: (uid, token) =>
    `${baseUrl}/${orgSlug}/password/reset/confirm/${uid}/${token}`,
  verificationLogin: (slug) => `${baseUrl}/${slug}/login`,
  mobileVerification: (slug) => `${baseUrl}/${slug}/mobile-phone-verification`,
  mobilePhoneChange: (slug) => `${baseUrl}/${slug}/change-phone-number`,
};

export const successToastSelector = ".Toastify__toast--success div[role=alert]";

// increase the jest global test time out
// because browser tests can take a bit longer to complete
jest.setTimeout(20000);
