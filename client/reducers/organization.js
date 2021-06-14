import {
  PARSE_ORGANIZATIONS,
  SET_AUTHENTICATION_STATUS,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
  SET_USER_DATA,
} from "../constants/action-types";

export const organizations = (state = [], action) => {
  switch (action.type) {
    case PARSE_ORGANIZATIONS:
      return action.payload;
    default:
      return state;
  }
};

export const initialState = {
  userData: {
    is_active: true,
    is_verified: true,
    justAuthenticated: true,
  },
  settings: {
    mobile_phone_verification: undefined,
  },
};

export const organization = (
  state = {exists: undefined, configuration: initialState},
  action,
) => {
  switch (action.type) {
    case SET_ORGANIZATION_CONFIG:
      return {...state, configuration: action.payload};
    case SET_ORGANIZATION_STATUS:
      return {...state, exists: action.payload};
    case SET_AUTHENTICATION_STATUS:
      return {
        ...state,
        configuration: {
          ...state.configuration,
          isAuthenticated: action.payload,
        },
      };
    case SET_USER_DATA:
      return {
        ...state,
        configuration: {
          ...state.configuration,
          userData: action.payload,
        },
      };
    default:
      return state;
  }
};
