import logoutAction from "./logout";
import {
  SET_AUTHENTICATION_STATUS,
  SET_MOBILE_PHONE_VERIFICATION_STATUS,
  IS_ACTIVE,
} from "../constants/action-types";

export const authenticate = (dispatch) => {
  return (status) => {
    dispatch({type: SET_AUTHENTICATION_STATUS, payload: status});
  };
};
export const verifyMobileNumber = (dispatch) => {
  return (status) => {
    dispatch({type: SET_MOBILE_PHONE_VERIFICATION_STATUS, payload: status});
  };
};
export const logout = (dispatch) => {
  return (cookies, slug) => {
    dispatch(logoutAction(cookies, slug));
  };
};
export const setIsActive = (dispatch) => {
  return (status) => {
    dispatch({type: IS_ACTIVE, payload: status});
  };
};
