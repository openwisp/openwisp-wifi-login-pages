import {SET_INTERNET_MODE} from "../constants/action-types";

const internetMode = (state = false, action) => {
  switch (action.type) {
    case SET_INTERNET_MODE:
      return action.payload;
    default:
      return state;
  }
};

export default internetMode;
