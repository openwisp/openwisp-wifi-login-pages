import {PARSE_ORGANIZATIONS, SET_ORGANIZATION} from "../constants/action-types";

export const parseOrganizations = (state = [], action) => {
  switch (action.type) {
    case PARSE_ORGANIZATIONS:
      return action.payload;
    default:
      return state;
  }
};

export const setOrganization = (state = {}, action) => {
  switch (action.type) {
    case SET_ORGANIZATION:
      return action.payload;
    default:
      return state;
  }
};
