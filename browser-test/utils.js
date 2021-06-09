import testData from "./testData.json";

const waitTime = 20000;
const orgSlug = "default";

export const getDriver = async (Builder, options) => {
  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();
  return driver;
};

export const getElementByXPath = async (driver, xpath, until, By) => {
  const el = await driver.wait(until.elementLocated(By.xpath(xpath)), waitTime);
  driver.wait(until.stalenessOf(el), waitTime);
  return el;
};

export const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const initialData = () => testData;

export const urls = {
  registration: `http://0.0.0.0:8080/${orgSlug}/registration`,
  login: `http://0.0.0.0:8080/${orgSlug}/login`,
  status: `http://0.0.0.0:8080/${orgSlug}/status`,
};
