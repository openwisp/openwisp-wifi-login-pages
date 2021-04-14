const isInternalLink = (link) => {
  if (link.length && link[0] === "/") return true;
  return false;
};
export default isInternalLink;
