import logoutAction from "./logout";
import {
  SET_AUTHENTICATION_STATUS,
  SET_USER_DATA,
  SET_PAGE_TITLE,
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
export const setTitleAction = (title) => {
  return {
    type: SET_PAGE_TITLE,
    payload: title,
  };
};
export const setTitle = (dispatch) => {
  return (componentTitle, orgName) => {
    dispatch(setTitleAction(`${componentTitle} - ${orgName}`));
  };
};
