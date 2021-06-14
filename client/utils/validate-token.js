import qs from "qs";
import axios from "axios";
import {toast} from "react-toastify";
import {genericError, validateApiUrl, mainToastId} from "../constants";
import handleSession from "./session";
import logError from "./log-error";
import {initialState} from "../reducers/organization";

const handleLogout = (logout, cookies, orgSlug, setUserData) => {
  logout(cookies, orgSlug);
  toast.error(genericError, {
    onOpen: () => toast.dismiss(mainToastId),
  });
  const {userData} = initialState;
  setUserData(userData);
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
        handleLogout(logout, cookies, orgSlug, setUserData);
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
        return false;
      }
      setUserData(response.data);
      return true;
    } catch (error) {
      handleLogout(logout, cookies, orgSlug, setUserData);
      logError(error, genericError);
      return false;
    }
  }
  // returns true if user data exists and skips calling the API
  else if (token && userData && Object.keys(userData).length > 0) {
    return true;
  }
  // returns false if token is invalid or user data is empty
  else {
    return false;
  }
};

export default validateToken;
