import {sessionStorage} from "./storage";

const authenticate = (cookies, orgSlug) => {
  /**
   * Check if user is authenticated by verifying token in either:
   * 1. sessionStorage (if remember-me was unchecked, session-only)
   * 2. cookies (if remember-me was checked, persistent)
   *
   * Note: Do NOT remove cookies here. That should only happen during logout.
   * This function is solely for checking authentication status.
   */
  const sessionKey = sessionStorage.getItem(`${orgSlug}_auth_token`);
  if (sessionKey) {
    return true;
  }
  const token = cookies.get(`${orgSlug}_auth_token`);
  if (token) return true;
  return false;
};
export default authenticate;
