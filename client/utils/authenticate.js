import {sessionStorage} from "./storage";

const authenticate = (cookies, orgSlug) => {
  const token = cookies.get(`${orgSlug}_authToken`);
  const sessionKey = sessionStorage.getItem(`${orgSlug}_authToken`);
  if (sessionKey) {
    cookies.remove(`${orgSlug}_authToken`, {path: "/"});
    cookies.remove(`${orgSlug}_username`, {path: "/"});
    return true;
  }
  if (token) return true;
  return false;
};
export default authenticate;
