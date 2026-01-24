import config from "../../test-config.json";

let defaultConfig = {};
try {
  // eslint-disable-next-line global-require
  defaultConfig = require("../../configs/default.json");
} catch (err) {
  // In test environment, configs/default.json doesn't exist
  // Fallback to the "default" org from test-config.json
  defaultConfig = config.find((org) => org.slug === "default") || {};
}
const getConfig = (slug, loadDefault = false) => {
  if (loadDefault) {
    return defaultConfig;
  }
  return config.find((org) => org.slug === slug);
};
export default getConfig;
