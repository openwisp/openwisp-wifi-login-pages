import {SET_AUTHENTICATION_STATUS} from "../constants/action-types";
import {sessionStorage} from "../utils/storage";

const logout = (cookies, orgSlug, userAutoLogin = false) => {
  if (!userAutoLogin) {
    cookies.remove(`${orgSlug}_auth_token`, {path: "/"});
    cookies.remove(`${orgSlug}_username`, {path: "/"});
    cookies.remove(`${orgSlug}_macaddr`, {path: "/"});
    sessionStorage.clear();
  }

  return {
    type: SET_AUTHENTICATION_STATUS,
    payload: false,
  };
};
export default logout;
