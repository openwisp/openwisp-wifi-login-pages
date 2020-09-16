import {SET_AUTHENTICATION_STATUS} from "../constants/action-types";

const logout = (cookies, orgSlug) => {
  cookies.remove(`${orgSlug}_auth_token`, {path: "/"});
  cookies.remove(`${orgSlug}_username`, {path: "/"});
  cookies.remove(`${orgSlug}_macaddr`, {path: "/"});

  return {
    type: SET_AUTHENTICATION_STATUS,
    payload: false,
  };
};
export default logout;
