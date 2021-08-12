import qs from "qs";
import axios from "axios";
import {t} from "ttag";
import {validateApiUrl} from "../constants";
import handleSession from "./session";
import logError from "./log-error";
import handleLogout from "./handle-logout";

const validateToken = async (
  cookies,
  orgSlug,
  setUserData,
  userData,
  logout,
) => {
  const url = validateApiUrl(orgSlug);
  const authToken = cookies.get(`${orgSlug}_auth_token`);
  const {token, session} = handleSession(orgSlug, authToken, cookies);
  // calling validate token API only if userData.radius_user_token is undefined
  if (token && userData && userData.radius_user_token === undefined) {
    try {
      const response = await axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url,
        data: qs.stringify({
          token,
          session,
        }),
      });
      if (response.data.response_code !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL") {
        handleLogout(logout, cookies, orgSlug, setUserData, userData);
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
        return false;
      }
      setUserData(response.data);
      return true;
    } catch (error) {
      handleLogout(logout, cookies, orgSlug, setUserData, userData);
      logError(error, t`ERR_OCCUR`);
      return false;
    }
  }
  // returns true if user data exists and skips calling the API
  else if (token && userData && Object.keys(userData).length > 0) {
    return true;
  }
  // returns false if token is invalid or user data is empty
  else {
    handleLogout(logout, cookies, orgSlug, setUserData, userData);
    return false;
  }
};

export default validateToken;
