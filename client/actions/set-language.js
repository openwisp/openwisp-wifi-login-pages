import {SET_LANGUAGE} from "../constants/action-types";

const setLanguage = (slug) => ({
  type: SET_LANGUAGE,
  payload: slug,
});

export default setLanguage;
