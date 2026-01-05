const shouldLinkBeShown = (link, isAuthenticated, userData) => {
  const {isVerified, method} = userData;
  if (method && link.methods_excluded && link.methods_excluded.includes(method)) {
    return false;
  }
  if (
    link.authenticated === isAuthenticated &&
    isAuthenticated === true &&
    link.verified !== undefined &&
    isVerified !== undefined
  ) {
    return link.verified === isVerified;
  }
  if (
    link.authenticated === isAuthenticated &&
    isAuthenticated === true &&
    link.methods_only !== undefined
  ) {
    return link.methods_only.includes(userData.method);
  }
  return link.authenticated === undefined || link.authenticated === isAuthenticated;
};
export default shouldLinkBeShown;
