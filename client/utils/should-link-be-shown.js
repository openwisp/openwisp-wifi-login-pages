/* eslint-disable camelcase */
const shouldLinkBeShown = (link, isAuthenticated, userData) => {
  const {is_verified, method} = userData;
  if (
    method &&
    link.methods_excluded &&
    link.methods_excluded.includes(method)
  ) {
    return false;
  }
  if (
    link.authenticated === isAuthenticated &&
    isAuthenticated === true &&
    link.verified !== undefined &&
    is_verified !== undefined
  ) {
    return link.verified === is_verified;
  }
  if (
    link.authenticated === isAuthenticated &&
    isAuthenticated === true &&
    link.methods_only !== undefined
  ) {
    return link.methods_only.includes(userData.method);
  }
  return (
    link.authenticated === undefined || link.authenticated === isAuthenticated
  );
};
export default shouldLinkBeShown;
