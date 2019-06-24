import merge from "deepmerge";

import {SET_LANGUAGE, SET_ORGANIZATION} from "../constants/action-types";
import customMerge from "../utils/custom-merge";
import getConfig from "../utils/get-config";

const setOrganization = slug => {
  return dispatch => {
    const orgConfig = getConfig(slug);
    if (orgConfig) {
      const defaultConfig = getConfig("default-slug");
      const config = merge(defaultConfig, orgConfig, {
        arrayMerge: customMerge,
      });

      dispatch({
        type: SET_ORGANIZATION,
        payload: config,
      });
      dispatch({
        type: SET_LANGUAGE,
        payload: config.default_language,
      });
    }
  };
};
export default setOrganization;
