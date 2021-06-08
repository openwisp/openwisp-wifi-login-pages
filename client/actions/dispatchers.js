import logoutAction from "./logout";
import {
  SET_AUTHENTICATION_STATUS,
  SET_MOBILE_PHONE_VERIFICATION_STATUS,
  IS_ACTIVE,
  SET_USER_DATA,
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
  return (cookies, slug, userAutoLogin) => {
    dispatch(logoutAction(cookies, slug, userAutoLogin));
  };
};
export const setIsActive = (dispatch) => {
  return (status) => {
    dispatch({type: IS_ACTIVE, payload: status});
  };
};
export const setUserData = (dispatch) => {
  return (data) => {
    dispatch({type: SET_USER_DATA, payload: data});
  };
};
