import {Builder, By, until} from "selenium-webdriver";
import {spawnSync} from "child_process";
import testData from "./testData.json";

const firefox = require("selenium-webdriver/firefox");

const waitTime = 5000;
const orgSlug = "default";

export const executeCommand = (command, argv) => {
  const result = spawnSync(command, [argv]);

  if (result.stdout) {
    process.stdout.write(`${result.stdout}\n`);
  }
  if (result.stderr) {
    process.stderr.write(`${result.stderr}\n`);
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
};

export const getDriver = async () =>
  new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(new firefox.Options().headless())
    .build();

export const getElementByCss = async (driver, css) => {
  let el;
  try {
    el = await driver.wait(until.elementLocated(By.css(css)), waitTime);
  } catch (err) {
    console.log(err, css);
  }
  return el;
};

export const getElementsByCss = async (driver, css) => {
  let el;
  try {
    el = await driver.wait(until.elementsLocated(By.css(css)), waitTime);
  } catch (err) {
    console.log(err, css);
  }
  return el;
};

export const initialData = () => testData;

export const initializeData = async (argv = null) => {
  await executeCommand(`./browser-test/initialize_data.py`, argv);
};

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

export const getPhoneToken = () => {
  const result = spawnSync("./browser-test/get_phone_token.py");
  return result.stdout.toString();
};

export const urls = {
  registration: `http://0.0.0.0:8080/${orgSlug}/registration`,
  login: `http://0.0.0.0:8080/${orgSlug}/login`,
  status: `http://0.0.0.0:8080/${orgSlug}/status`,
  passwordChange: `http://0.0.0.0:8080/${orgSlug}/change-password`,
  passwordReset: `http://0.0.0.0:8080/${orgSlug}/password/reset`,
  passwordConfirm: (uid, token) =>
    `http://0.0.0.0:8080/${orgSlug}/password/reset/confirm/${uid}/${token}`,
  verificationLogin: (slug) => `http://0.0.0.0:8080/${slug}/login`,
  mobileVerification: (slug) =>
    `http://0.0.0.0:8080/${slug}/mobile-phone-verification`,
  mobilePhoneChange: (slug) =>
    `http://0.0.0.0:8080/${slug}/change-phone-number`,
};

export const successToastSelector = ".Toastify__toast--success div[role=alert]";

// increase the jest global test time out
// because browser tests can take a bit longer to complete
jest.setTimeout(10000);
