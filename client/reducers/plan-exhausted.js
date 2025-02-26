import {SET_PLAN_EXHAUSTED} from "../constants/action-types";

const planExhausted = (state = false, action) => {
  switch (action.type) {
    case SET_PLAN_EXHAUSTED:
      return action.payload;
    default:
      return state;
  }
};

export default planExhausted;
