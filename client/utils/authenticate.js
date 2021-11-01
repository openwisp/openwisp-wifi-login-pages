import {sessionStorage} from "./storage";

const authenticate = (cookies, orgSlug) => {
  const token = cookies.get(`${orgSlug}_auth_token`);
  const sessionKey = sessionStorage.getItem(`${orgSlug}_auth_token`);
  if (sessionKey) {
    cookies.remove(`${orgSlug}_auth_token`, {path: "/"});
    cookies.remove(`${orgSlug}_username`, {path: "/"});
    return true;
  }
  if (token) return true;
  return false;
};
export default authenticate;
