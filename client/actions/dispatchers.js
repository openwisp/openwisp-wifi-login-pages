import logoutAction from "./logout";
import {
  SET_AUTHENTICATION_STATUS,
  SET_USER_DATA,
  SET_PAGE_TITLE,
} from "../constants/action-types";

export const authenticate = (dispatch) => (status) => {
  dispatch({type: SET_AUTHENTICATION_STATUS, payload: status});
};
export const logout = (dispatch) => (cookies, slug, userAutoLogin) => {
  dispatch(logoutAction(cookies, slug, userAutoLogin));
};
export const setUserData = (dispatch) => (data) => {
  dispatch({type: SET_USER_DATA, payload: data});
};
export const setTitleAction = (title) => ({
  type: SET_PAGE_TITLE,
  payload: title,
});
export const setTitle = (dispatch) => (componentTitle, orgName) => {
  dispatch(setTitleAction(`${componentTitle} - ${orgName}`));
};
