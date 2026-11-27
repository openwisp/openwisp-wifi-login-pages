import {
  SET_AUTHENTICATION_STATUS,
  SET_LANGUAGE,
  SET_ORGANIZATION_CONFIG,
  SET_ORGANIZATION_STATUS,
  SET_USER_DATA,
  SET_PAGE_TITLE,
} from "../constants/action-types";
import authenticate from "../utils/authenticate";
import getConfig from "../utils/get-config";
import logout from "./logout";
import {initialState} from "../reducers/organization";
import {localStorage, sessionStorage} from "../utils/storage";
import {readContinuation} from "../utils/continuation";
import validateToken from "../utils/validate-token";

// Restores the authenticated session of the user bound to a pending login
// continuation (`?next=`). With captive portal synchronous authentication the
// portal login reloads the app, which would otherwise start unauthenticated
// and lose the continuation before Status can follow it.
const restoreReturn = async (slug, cookies, location, config, dispatch) => {
  const path = location.pathname || "";
  const record = readContinuation(slug);
  const token =
    sessionStorage.getItem(`${slug}_auth_token`) ||
    cookies.get(`${slug}_auth_token`);
  if (!token) return false;
  if (
    !config.components.captive_portal_sync_auth ||
    !record ||
    !record.username ||
    !path.startsWith(`/${slug}/`) ||
    path.startsWith(`/${slug}/login`)
  )
    return false;
  let restored;
  const valid = await validateToken(
    cookies,
    slug,
    (data) => {
      restored = data;
    },
    {...initialState.userData, auth_token: token},
    (browserCookies, orgSlug) => dispatch(logout(browserCookies, orgSlug)),
    config.default_language,
  );
  if (
    valid &&
    restored.username === record.username &&
    restored.is_active !== false
  ) {
    dispatch({
      type: SET_USER_DATA,
      payload: {...initialState.userData, ...restored, mustLogin: true},
    });
    dispatch({type: SET_AUTHENTICATION_STATUS, payload: true});
  } else if (valid) {
    dispatch(logout(cookies, slug));
  }
  return true;
};

const setOrganization =
  (slug, cookies, location = {}) =>
  async (dispatch) => {
    // drops a continuation that was started in another organization
    readContinuation(slug);
    const orgConfig = await getConfig(slug);
    if (orgConfig) {
      const config = orgConfig;
      config.userData = initialState.userData;
      dispatch({
        type: SET_LANGUAGE,
        payload: config.default_language,
      });
      dispatch({
        type: SET_PAGE_TITLE,
        payload: config.name,
      });
      dispatch({
        type: SET_ORGANIZATION_STATUS,
        payload: true,
      });
      dispatch({
        type: SET_ORGANIZATION_CONFIG,
        payload: config,
      });
      dispatch({
        type: SET_USER_DATA,
        payload: initialState.userData,
      });
      if (await restoreReturn(slug, cookies, location, config, dispatch))
        return;
      const userAutoLogin = localStorage.getItem("userAutoLogin") === "true";
      if (config.auto_login && authenticate(cookies, slug)) {
        dispatch({
          type: SET_AUTHENTICATION_STATUS,
          payload: true,
        });
      } else {
        logout(cookies, slug, userAutoLogin);
      }
    } else {
      dispatch({
        type: SET_ORGANIZATION_STATUS,
        payload: false,
      });
    }
  };
export default setOrganization;
