/* eslint-disable global-require */
import config from "../../test-config.json";

let defaultConfig = {};
try {
  defaultConfig = require("../../configs/default.json");
} catch (err) {
  /* eslint-disable-next-line no-console */
  console.error("Forget to run yarn setup before tests?");
}
const getConfig = (slug, loadDefault = false) => {
  if (loadDefault) {
    return defaultConfig;
  }
  return config.find((org) => org.slug === slug);
};
export default getConfig;
