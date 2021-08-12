import {toast} from "react-toastify";
import {t} from "ttag";
import {initialState} from "../reducers/organization";

const redirectToStatus = (setUserData, userData, orgSlug) => {
  setUserData({...userData, mustLogout: true});
  window.location.assign(`${window.location.origin}/${orgSlug}/status`);
};

const handleLogout = (logout, cookies, orgSlug, setUserData, userData) => {
  /*
   * Redirecting to the status page for captive-portal logout if the
   * method is unspecified or bank_card or the user is verified.
   */
  if (
    userData.is_active === true &&
    (userData.method === "" ||
      userData.method === "bank_card" ||
      userData.is_verified === true)
  ) {
    redirectToStatus(setUserData, userData, orgSlug);
    return;
  }
  logout(cookies, orgSlug);
  toast.error(t`ERR_OCCUR`);
  setUserData(initialState.userData);
};

export default handleLogout;
