import merge from "deepmerge";

import {
  SET_AUTHENTICATION_STATUS,
  SET_LANGUAGE,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
} from "../constants/action-types";
import authenticate from "../utils/authenticate";
import customMerge from "../utils/custom-merge";
import getConfig from "../utils/get-config";
import logout from "./logout";

const setOrganization = (slug, cookies) => {
  return (dispatch) => {
    const orgConfig = getConfig(slug);
    if (orgConfig) {
      const defaultConfig = getConfig("default");
      const config = merge(defaultConfig, orgConfig, {
        arrayMerge: customMerge,
      });
      dispatch({
        type: SET_LANGUAGE,
        payload: config.default_language,
      });
      dispatch({
        type: SET_ORGANIZATION_STATUS,
        payload: true,
      });
      dispatch({
        type: SET_ORGANIZATION_CONFIG,
        payload: config,
      });
      const autoLogin = config.auto_login;
      if (autoLogin) {
        if (authenticate(cookies, slug)) {
          dispatch({
            type: SET_AUTHENTICATION_STATUS,
            payload: true,
          });
        } else {
          logout(cookies, slug);
        }
      } else {
        logout(cookies, slug);
      }
    } else {
      dispatch({
        type: SET_ORGANIZATION_STATUS,
        payload: false,
      });
    }
  };
};
export default setOrganization;
