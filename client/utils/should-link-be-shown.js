const shouldLinkBeShown = (link, isAuthenticated) => {
  return (
    link.authenticated === undefined || link.authenticated === isAuthenticated
  );
};
export default shouldLinkBeShown;
