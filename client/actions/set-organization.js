import merge from "deepmerge";

import {
  SET_LANGUAGE,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
} from "../constants/action-types";
import customMerge from "../utils/custom-merge";
import getConfig from "../utils/get-config";

const setOrganization = slug => {
  return dispatch => {
    const orgConfig = getConfig(slug);
    if (orgConfig) {
      const defaultConfig = getConfig("default");
      const config = merge(defaultConfig, orgConfig, {
        arrayMerge: customMerge,
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
        type: SET_LANGUAGE,
        payload: config.default_language,
      });
    } else {
      dispatch({
        type: SET_ORGANIZATION_STATUS,
        payload: false,
      });
    }
  };
};
export default setOrganization;
