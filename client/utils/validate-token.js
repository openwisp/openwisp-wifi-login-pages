import qs from "qs";
import axios from "axios";
import {t} from "ttag";
import {toast} from "react-toastify";
import {validateApiUrl, mainToastId} from "../constants";
import handleSession from "./session";
import logError from "./log-error";
import handleLogout from "./handle-logout";
import getLanguageHeaders from "./get-language-headers";

const validateToken = async (
  cookies,
  orgSlug,
  setUserData,
  userData,
  logout,
  language,
) => {
  const url = validateApiUrl(orgSlug);
  // get auth token from redux state, otherwise try getting it from cookies
  const authToken = userData.authToken || cookies.get(`${orgSlug}_authToken`);
  const {token, session} = handleSession(orgSlug, authToken, cookies);
  // calling validate token API only if userData.radius_user_token is undefined
  // or payment_url of user is undefined
  if (
    userData &&
    ((token &&
      (userData.radius_user_token === undefined ||
        userData.password_expired === true)) ||
      (userData.method === "bank_card" &&
        userData.isVerified !== true &&
        !userData.payment_url))
  ) {
    try {
      const response = await axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": getLanguageHeaders(language),
        },
        url,
        data: qs.stringify({
          token,
          session,
        }),
      });
      if (response.data.response_code !== "authToken_VALIDATION_SUCCESSFUL") {
        handleLogout(logout, cookies, orgSlug, setUserData, userData);
        logError(response, '"response_code" !== "authToken_VALIDATION_SUCCESSFUL"');
        return false;
      }
      setUserData(response.data);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        toast.error(error.response.data.detail, {
          toastId: mainToastId,
        });
        // Instead of redirecting to status page, it will logout the user.
        handleLogout(
          logout,
          cookies,
          orgSlug,
          setUserData,
          {...userData, isActive: false},
          true,
        );
      } else {
        logError(error, t`ERR_OCCUR`);
        handleLogout(logout, cookies, orgSlug, setUserData, userData);
      }
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
