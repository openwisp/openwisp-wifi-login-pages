import {
  PARSE_ORGANIZATIONS,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
} from "../constants/action-types";

export const parseOrganizations = (state = [], action) => {
  switch (action.type) {
    case PARSE_ORGANIZATIONS:
      return action.payload;
    default:
      return state;
  }
};

export const setOrganization = (
  state = {exists: undefined, configuration: {}},
  action,
) => {
  switch (action.type) {
    case SET_ORGANIZATION_CONFIG:
      return {...state, configuration: action.payload};
    case SET_ORGANIZATION_STATUS:
      return {...state, exists: action.payload};
    default:
      return state;
  }
};
