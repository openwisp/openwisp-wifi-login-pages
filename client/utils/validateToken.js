import qs from "qs";
import axios from "axios";
import {genericError, validateApiUrl} from "../constants";
import handleSession from "./session";
import logError from "./log-error";

const validateToken = async (cookies, orgSlug, setUserData, userData) => {
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
        // logout will be handled from HOC
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
        return false;
      }
      setUserData(response.data);
      return true;
    } catch (error) {
      // logout will be handled from HOC
      logError(error, genericError);
      return false;
    }
  } else {
    return false;
  }
};

export default validateToken;
