import config from "../config.json";

const defaultConfig = config.find(org => {
	return org.slug === "default-slug";
});
export default defaultConfig;
