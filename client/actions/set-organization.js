import {
  SET_AUTHENTICATION_STATUS,
  SET_LANGUAGE,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
  SET_USER_DATA,
  SET_PAGE_TITLE,
} from "../constants/action-types";
import authenticate from "../utils/authenticate";
import getConfig from "../utils/get-config";
import logout from "./logout";
import {initialState} from "../reducers/organization";
import {localStorage} from "../utils/storage";

const setOrganization = (slug, cookies) => async (dispatch) => {
  const orgConfig = await getConfig(slug);
  if (orgConfig) {
    const config = orgConfig;
    config.userData = initialState.userData;
    dispatch({
      type: SET_LANGUAGE,
      payload: config.default_language,
    });
    dispatch({
      type: SET_PAGE_TITLE,
      payload: config.name,
    });
    dispatch({
      type: SET_ORGANIZATION_STATUS,
      payload: true,
    });
    dispatch({
      type: SET_ORGANIZATION_CONFIG,
      payload: config,
    });
    dispatch({
      type: SET_USER_DATA,
      payload: initialState.userData,
    });
    const autoLogin = config.auto_login;
    const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";
    if (autoLogin) {
      if (authenticate(cookies, slug)) {
        dispatch({
          type: SET_AUTHENTICATION_STATUS,
          payload: true,
        });
      } else {
        logout(cookies, slug, userAutoLogin);
      }
    } else {
      logout(cookies, slug, userAutoLogin);
    }
  } else {
    dispatch({
      type: SET_ORGANIZATION_STATUS,
      payload: false,
    });
  }
};
export default setOrganization;
