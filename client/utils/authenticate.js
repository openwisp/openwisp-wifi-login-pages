const authenticate = (cookies, orgSlug) => {
  const token = cookies.get(`${orgSlug}_auth_token`);
  if (token) return true;
  return false;
};
export default authenticate;
