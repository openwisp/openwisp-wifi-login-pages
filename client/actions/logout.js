import {SET_AUTHENTICATION_STATUS} from "../constants/action-types";
import {sessionStorage, localStorage} from "../utils/storage";

const logout = (cookies, orgSlug, userAutoLogin = false) => {
  if (!userAutoLogin) {
    cookies.remove(`${orgSlug}_authToken`, {path: "/"});
    cookies.remove(`${orgSlug}_username`, {path: "/"});
    cookies.remove(`${orgSlug}_macaddr`, {path: "/"});
    sessionStorage.clear();
  }
  [`${orgSlug}_mustLogin`, `${orgSlug}_mustLogout`].forEach((element) => {
    cookies.remove(element, {path: "/"});
    localStorage.removeItem(element);
  });

  return {
    type: SET_AUTHENTICATION_STATUS,
    payload: false,
  };
};
export default logout;
