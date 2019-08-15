const authenticate = (cookies, orgSlug) => {
  if (orgSlug === "default") return true;
  return false;
};
export default authenticate;
