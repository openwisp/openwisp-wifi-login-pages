import config from "../config.json";

const defaultConfig = config.find((org) => org.slug === "default");
export default defaultConfig;
