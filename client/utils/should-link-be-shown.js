/* eslint-disable camelcase */
const shouldLinkBeShown = (link, isAuthenticated, userData) => {
  const {is_verified} = userData;
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
    link.method !== undefined
  ) {
    return link.method === userData.method;
  }
  return (
    link.authenticated === undefined || link.authenticated === isAuthenticated
  );
};
export default shouldLinkBeShown;
