const loadConfig = (slug) => import(`../configs/${slug}.json`);
const getConfig = async (slug) => {
  let config;
  try {
    config = await loadConfig(slug);
  } catch (err) {
    console.error(`Configuration for organization ${slug} does not exists.`);
    config = undefined;
  }
  return config;
};

export default getConfig;
