import {spawn} from "child_process";
import testData from "./testData.json";

const waitTime = 5000;
const orgSlug = "default";

export const executeCommand = async (command, argv) => {
  const executor = await spawn(command, [argv]);
  executor.stdout.on("data", (data) => {
    process.stdout.write(`${data}\n`);
  });

  executor.stderr.on("data", (data) => {
    process.stderr.write(`stderr: ${data}\n`);
  });

  executor.on("error", (error) => {
    process.stderr.write(`error: ${error.message}\n`);
  });

  executor.on("close", (exitCode) => {
    if (exitCode !== 0) process.exit(exitCode);
  });
};

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

export const initializeData = async (argv = null) => {
  await executeCommand(`./browser-test/initialize_data.py`, argv);
};

export const clearData = async () => {
  await executeCommand("./browser-test/clear_data.py", () => {});
};

export const urls = {
  registration: `http://0.0.0.0:8080/${orgSlug}/registration`,
  login: `http://0.0.0.0:8080/${orgSlug}/login`,
  status: `http://0.0.0.0:8080/${orgSlug}/status`,
};
