const isOldBrowser = () =>
  typeof window.oldBrowser !== "undefined" && window.oldBrowser;

export default isOldBrowser;
