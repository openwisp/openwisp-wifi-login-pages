import {SET_LANGUAGE} from "../constants/action-types";

const setLanguage = (state = "", action) => {
  switch (action.type) {
    case SET_LANGUAGE:
      return action.payload;
    default:
      return state;
  }
};

export default setLanguage;
