import {localStorage} from "./storage";

/**
 * Stores a value in both cookies and localStorage if synchronous
 * captive portal authentication is enabled.
 *
 * In synchronous authentication, submitting the captive portal form
 * triggers a page reload, which resets the component state.
 * Storing the value in cookies ensures it persists across reloads.
 *
 * The value is also saved in localStorage as a fallback in case the browser does not support cookies.
 *
 * @param {boolean} captivePortalSyncAuth - Whether synchronous authentication is enabled.
 * @param {string} key - The key under which the value is stored.
 * @param {boolean} value - The value to store.
 * @param {Cookies} cookies - The cookies instance used to set the cookie.
 */
export const storeValue = (captivePortalSyncAuth, key, value, cookies) => {
  if (!captivePortalSyncAuth) {
    return;
  }
  localStorage.setItem(key, value);
  cookies.set(key, value, {path: "/", maxAge: 60});
};

/**
 * Resolves the correct value by checking cookies, then localStorage,
 * falling back to a default value if neither is found.
 *
 * @param {boolean} captivePortalSyncAuth - Whether synchronization is enabled.
 * @param {string} key - The key to look for in cookies and localStorage.
 * @param {*} fallback - The fallback value if no valid stored value is found.
 * @param {Cookies} cookies - The cookies instance used to get the cookie.
 * @returns {*} - The selected value based on storage or fallback.
 */
export const resolveStoredValue = (
  captivePortalSyncAuth,
  key,
  fallback,
  cookies,
) => {
  if (!captivePortalSyncAuth) {
    return fallback;
  }

  const cookieValue = cookies.get(key);
  if (cookieValue !== undefined) {
    localStorage.removeItem(key);
    return cookieValue === true || cookieValue === "true";
  }

  const localStorageValue = localStorage.getItem(key);
  if (localStorageValue !== null) {
    localStorage.removeItem(key);
    return localStorageValue === "true";
  }

  return fallback;
};
