import config from "../config.json";

const getConfig = (slug) =>
  config.find((org) => {
    return org.slug === slug;
  });
export default getConfig;
