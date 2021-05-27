import logoutAction from "./logout";
import {
  SET_AUTHENTICATION_STATUS,
  SET_USER_DATA,
} from "../constants/action-types";

export const authenticate = (dispatch) => {
  return (status) => {
    dispatch({type: SET_AUTHENTICATION_STATUS, payload: status});
  };
};
export const logout = (dispatch) => {
  return (cookies, slug, userAutoLogin) => {
    dispatch(logoutAction(cookies, slug, userAutoLogin));
  };
};
export const setUserData = (dispatch) => {
  return (data) => {
    dispatch({type: SET_USER_DATA, payload: data});
  };
};
