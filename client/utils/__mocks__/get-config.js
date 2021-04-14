import config from "../../test-config.json";

const getConfig = (slug) =>
  config.find((org) => {
    return org.slug === slug;
  });
export default getConfig;
