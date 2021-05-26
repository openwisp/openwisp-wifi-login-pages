import qs from "qs";
import axios from "axios";
import {toast} from "react-toastify";
import {genericError, validateApiUrl, mainToastId} from "../constants";
import handleSession from "./session";
import logError from "./log-error";

const handleLogout = (logout, cookies, orgSlug) => {
  logout(cookies, orgSlug);
  toast.error(genericError, {
    onOpen: () => toast.dismiss(mainToastId),
  });
};

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
  // calling validate token API only if userData is undefined
  if (token && userData && Object.keys(userData).length === 0) {
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
        handleLogout(logout, cookies, orgSlug);
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
        return false;
      }
      setUserData(response.data);
      return true;
    } catch (error) {
      handleLogout(logout, cookies, orgSlug);
      logError(error, genericError);
      return false;
    }
  }
  // returns true if user data exists and skips calling the API
  else if (userData && Object.keys(userData).length !== 0) {
    return true;
  } else {
    return false;
  }
};

export default validateToken;
