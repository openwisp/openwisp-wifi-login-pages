import {sessionStorage} from "./storage";

const handleSession = (orgSlug, token, cookies) => {
  /**
   * This function is used to check whether sessionStorage or cookies
   * is used to store the token. If remember-me checkbox is unchecked
   * then sessionStorage will be used to store the token and all the
   * cookies will be cleared. It will return an object which contains
   * the token and session with value equals true.
   * If remember-me checkbox is checked then it will not clear any cookies
   * and returns an object with token and session with value equals false.
   */
  const sessionKey = sessionStorage.getItem(`${orgSlug}_auth_token`);
  if (sessionKey) {
    cookies.remove(`${orgSlug}_auth_token`, {path: "/"});
    return {
      token: sessionKey,
      session: true,
    };
  }
  return {
    token,
    session: false,
  };
};

export default handleSession;
