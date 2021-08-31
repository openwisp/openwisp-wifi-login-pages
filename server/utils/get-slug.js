const getSlug = (config) => {
  const {slug, custom, radiusSlug} = config;
  return custom ? radiusSlug : slug;
};

export default getSlug;
