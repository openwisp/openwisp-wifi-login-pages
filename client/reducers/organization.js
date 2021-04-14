import {
  PARSE_ORGANIZATIONS,
  SET_AUTHENTICATION_STATUS,
  SET_MOBILE_PHONE_VERIFICATION_STATUS,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
} from "../constants/action-types";

export const organizations = (state = [], action) => {
  switch (action.type) {
    case PARSE_ORGANIZATIONS:
      return action.payload;
    default:
      return state;
  }
};

export const organization = (
  state = {exists: undefined, configuration: {}},
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
    case SET_MOBILE_PHONE_VERIFICATION_STATUS:
      return {
        ...state,
        configuration: {
          ...state.configuration,
          needsMobilePhoneVerification: action.payload,
        },
      };
    default:
      return state;
  }
};
