const loadConfig = (slug) =>
  import(/* webpackChunkName: 'orgConfig' */ `../configs/${slug}.json`);
const getConfig = async (slug) => {
  let config;
  try {
    config = await loadConfig(slug);
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(`Configuration for organization ${slug} does not exists.`);
    config = undefined;
  }
  return config;
};

export default getConfig;
