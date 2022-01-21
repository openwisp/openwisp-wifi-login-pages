import {
  PARSE_ORGANIZATIONS,
  SET_AUTHENTICATION_STATUS,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
  SET_PAGE_TITLE,
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
    is_verified: null,
    mustLogin: true,
    mustLogout: false,
    repeatLogin: false,
    auth_token: undefined,
    radius_user_token: undefined,
    payment_url: undefined,
  },
  settings: {
    mobile_phone_verification: undefined,
    subscriptions: undefined,
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
    case SET_PAGE_TITLE:
      return {
        ...state,
        configuration: {
          ...state.configuration,
          pageTitle: action.payload,
        },
      };
    default:
      return state;
  }
};
