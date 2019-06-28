import {SET_LANGUAGE} from "../constants/action-types";

const setLanguage = slug => {
  return dispatch => {
    dispatch({
      type: SET_LANGUAGE,
      payload: slug,
    });
  };
};

export default setLanguage;
