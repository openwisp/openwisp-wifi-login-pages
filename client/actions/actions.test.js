import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

import axios from "axios";
import {Cookies} from "react-cookie";
import * as types from "../constants/action-types";
import testOrgConfig from "../test-config.json";
import {
  setTitleAction,
  authenticate,
  logout as logoutAction,
  setUserData,
  setInternetMode,
  setPlanExhausted,
} from "./dispatchers";
import logout from "./logout";
import parseOrganizations from "./parse-organizations";
import setLanguage from "./set-language";
import setOrganization from "./set-organization";
import {initialState} from "../reducers/organization";
import {
  beginContinuation,
  bindContinuation,
  readContinuation,
} from "../utils/continuation";
import {
  localStorage as safeLocalStorage,
  sessionStorage as safeSessionStorage,
} from "../utils/storage";
import {resolveStoredValue} from "../utils/synced-storage";
import {
  storePaymentReturnContext,
  takePaymentReturnContext,
} from "../utils/payment";

jest.mock("../utils/get-config");
jest.mock("../utils/authenticate");
jest.mock("axios");
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
describe("actions testing", () => {
  let cookies;
  let dispatch;
  beforeEach(() => {
    dispatch = jest.fn();
    cookies = {
      get: jest.fn().mockImplementationOnce(() => true),
      remove: jest.fn(),
    };
  });
  afterEach(() => {
    jest.resetAllMocks();
    safeLocalStorage.clear();
    safeSessionStorage.clear();
  });
  it("should create an action to parse organizations", () => {
    const expectedActions = [
      {
        type: types.PARSE_ORGANIZATIONS,
        payload: testOrgConfig,
      },
    ];
    const store = mockStore({organizations: []});
    store.dispatch(parseOrganizations(testOrgConfig));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("should create an action to set language", () => {
    const language = "en";
    const expectedActions = [
      {
        type: types.SET_LANGUAGE,
        payload: language,
      },
    ];
    const store = mockStore({language: ""});
    store.dispatch(setLanguage(language));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("should create actions to set current organization", async () => {
    const orgConfig = testOrgConfig[2];
    const orgConfig2 = testOrgConfig[1];
    const {userData} = initialState;
    orgConfig.userData = userData;
    orgConfig2.userData = userData;
    testOrgConfig[0].userData = userData;
    const expectedActions = [
      {
        type: types.SET_LANGUAGE,
        payload: testOrgConfig[0].default_language,
      },
      {
        type: types.SET_PAGE_TITLE,
        payload: testOrgConfig[2].name,
      },
      {
        type: types.SET_ORGANIZATION_STATUS,
        payload: true,
      },
      {
        type: types.SET_ORGANIZATION_CONFIG,
        payload: orgConfig,
      },
      {
        type: types.SET_USER_DATA,
        payload: userData,
      },
      {
        type: types.SET_LANGUAGE,
        payload: testOrgConfig[1].default_language,
      },
      {
        type: types.SET_PAGE_TITLE,
        payload: testOrgConfig[1].name,
      },
      {
        type: types.SET_ORGANIZATION_STATUS,
        payload: true,
      },
      {
        type: types.SET_ORGANIZATION_CONFIG,
        payload: orgConfig2,
      },
      {
        type: types.SET_USER_DATA,
        payload: userData,
      },
      {
        type: types.SET_LANGUAGE,
        payload: testOrgConfig[0].default_language,
      },
      {
        type: types.SET_PAGE_TITLE,
        payload: testOrgConfig[0].name,
      },
      {
        type: types.SET_ORGANIZATION_STATUS,
        payload: true,
      },
      {
        type: types.SET_ORGANIZATION_CONFIG,
        payload: testOrgConfig[0],
      },
      {
        type: types.SET_USER_DATA,
        payload: userData,
      },
      {
        type: types.SET_AUTHENTICATION_STATUS,
        payload: true,
      },
      {
        type: types.SET_ORGANIZATION_STATUS,
        payload: false,
      },
    ];
    const store = mockStore({language: "", organization: {}});
    await store.dispatch(setOrganization(testOrgConfig[2].slug, cookies));
    await store.dispatch(setOrganization(testOrgConfig[1].slug, cookies));
    await store.dispatch(setOrganization(testOrgConfig[0].slug, cookies));
    await store.dispatch(setOrganization("invalid-slug"));
    expect(store.getActions()).toEqual(expectedActions);
  });
  it("should create an action to logout", () => {
    sessionStorage.setItem("test", "test");
    const orgSlug = "default";
    const expectedActions = [
      {
        type: types.SET_AUTHENTICATION_STATUS,
        payload: false,
      },
    ];
    const store = mockStore({organization: {configuration: {}}});
    store.dispatch(logout(cookies, orgSlug));
    expect(store.getActions()).toEqual(expectedActions);
    expect(sessionStorage.getItem("test")).toBe(null);
  });

  it.each([false, true])(
    "clears persisted captive portal flags on logout with auto-login %s",
    (userAutoLogin) => {
      const orgSlug = "default";
      const browserCookies = new Cookies();
      const flags = [
        "mustLogin",
        "mustLogout",
        "repeatLogin",
        "captivePortalLogoutOnly",
        "proceedToPayment",
      ];
      flags.forEach((flag) => {
        const key = `${orgSlug}_${flag}`;
        browserCookies.set(key, "true", {path: "/"});
        safeLocalStorage.setItem(key, "true");
      });
      browserCookies.set("other_mustLogin", "true", {path: "/"});
      safeLocalStorage.setItem("other_mustLogin", "true");
      logout(browserCookies, orgSlug, userAutoLogin);
      flags.forEach((flag) => {
        const key = `${orgSlug}_${flag}`;
        expect(browserCookies.get(key)).toBeUndefined();
        expect(safeLocalStorage.getItem(key)).toBeNull();
        expect(resolveStoredValue(true, key, undefined, browserCookies)).toBe(
          undefined,
        );
      });
      expect(browserCookies.get("other_mustLogin")).toBe(true);
      expect(safeLocalStorage.getItem("other_mustLogin")).toBe("true");
    },
  );

  const validationResponse = {
    data: {
      response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      username: "alice",
      auth_token: "fixture-api-token",
      is_active: true,
    },
  };

  it("clears continuation even when logout retains auto-login credentials", () => {
    beginContinuation("?next=/default/status", "default");
    storePaymentReturnContext(
      {in_upgrade: true, payment_requires_internet: false},
      {},
    );
    logout(cookies, "default", true);
    expect(readContinuation("default")).toBeNull();
    expect(takePaymentReturnContext()).toBeNull();
  });

  it.each([false, true])(
    "restores an owned controlled return with auto-login disabled (session %s)",
    async (useSession) => {
      beginContinuation("?next=/test-org-1/payment/process/", "test-org-1");
      bindContinuation("test-org-1", "alice");
      if (useSession)
        safeSessionStorage.setItem(
          "test-org-1_auth_token",
          "fixture-api-token",
        );
      const browserCookies = {
        get: (key) =>
          ({
            "test-org-1_auth_token": useSession
              ? undefined
              : "fixture-api-token",
            "test-org-1_username": "alice",
          })[key],
        remove: jest.fn(),
      };
      axios.mockResolvedValueOnce(validationResponse);
      const store = mockStore({organization: {}});
      await store.dispatch(
        setOrganization("test-org-1", browserCookies, {
          pathname: "/test-org-1/status",
        }),
      );
      expect(store.getActions()).toContainEqual({
        type: types.SET_AUTHENTICATION_STATUS,
        payload: true,
      });
      expect(axios).toHaveBeenCalledTimes(1);
      expect(readContinuation("test-org-1").username).toBe("alice");
    },
  );

  it("clears the previous organization's continuation on organization change", async () => {
    beginContinuation("?next=/test-org-1/status", "test-org-1");
    const store = mockStore({organization: {}});
    await store.dispatch(setOrganization("default", cookies));
    expect(safeSessionStorage.getItem("ow_continuation")).toBeFalsy();
    expect(readContinuation("test-org-1")).toBeNull();
  });

  it("falls back to logout without a bound continuation (sync auth, auto_login false)", async () => {
    safeSessionStorage.setItem("test-org-1_auth_token", "fixture-api-token");
    const browserCookies = {get: jest.fn(), remove: jest.fn()};
    const store = mockStore({organization: {}});
    await store.dispatch(
      setOrganization("test-org-1", browserCookies, {
        pathname: "/test-org-1/status",
      }),
    );
    expect(axios).not.toHaveBeenCalled();
    expect(store.getActions()).not.toContainEqual({
      type: types.SET_AUTHENTICATION_STATUS,
      payload: true,
    });
  });

  it("ignores a stale captivePortalLogoutOnly flag", async () => {
    safeSessionStorage.setItem("test-org-1_auth_token", "fixture-api-token");
    localStorage.setItem("test-org-1_captivePortalLogoutOnly", "true");
    const browserCookies = {
      get: (key) =>
        key === "test-org-1_captivePortalLogoutOnly" ? true : undefined,
      remove: jest.fn(),
    };
    const store = mockStore({organization: {}});
    await store.dispatch(
      setOrganization("test-org-1", browserCookies, {
        pathname: "/test-org-1/status",
      }),
    );
    localStorage.removeItem("test-org-1_captivePortalLogoutOnly");
    expect(axios).not.toHaveBeenCalled();
    expect(store.getActions()).not.toContainEqual({
      type: types.SET_AUTHENTICATION_STATUS,
      payload: true,
    });
  });

  it("restores a bound continuation despite a stale captivePortalLogoutOnly flag", async () => {
    beginContinuation("?next=/test-org-1/payment/process/", "test-org-1");
    bindContinuation("test-org-1", "alice");
    safeSessionStorage.setItem("test-org-1_auth_token", "fixture-api-token");
    safeLocalStorage.setItem("test-org-1_captivePortalLogoutOnly", "true");
    const browserCookies = {
      get: (key) =>
        key === "test-org-1_captivePortalLogoutOnly" ? true : undefined,
      remove: jest.fn(),
    };
    axios.mockResolvedValueOnce(validationResponse);
    const store = mockStore({organization: {}});
    await store.dispatch(
      setOrganization("test-org-1", browserCookies, {
        pathname: "/test-org-1/status",
      }),
    );
    expect(axios).toHaveBeenCalledTimes(1);
    expect(store.getActions()).toContainEqual({
      type: types.SET_AUTHENTICATION_STATUS,
      payload: true,
    });
    expect(readContinuation("test-org-1").username).toBe("alice");
  });

  it("should create an action to set page title", () => {
    const title = "default name";
    const expectedActions = [
      {
        type: types.SET_PAGE_TITLE,
        payload: title,
      },
    ];
    const store = mockStore({pageTitle: ""});
    store.dispatch(setTitleAction(title));
    expect(store.getActions()).toEqual(expectedActions);
  });
  it("should dispatch authenticate action", () => {
    const action = authenticate(dispatch);
    action(true);
    expect(dispatch).toHaveBeenCalledWith({
      payload: true,
      type: types.SET_AUTHENTICATION_STATUS,
    });
  });
  it("should dispatch logout action", () => {
    const action = logoutAction(dispatch);
    action(cookies, "default");
    expect(cookies.remove).toHaveBeenCalledWith("default_auth_token", {
      path: "/",
    });
    expect(cookies.remove).toHaveBeenCalledWith("default_username", {
      path: "/",
    });
    expect(cookies.remove).toHaveBeenCalledWith("default_macaddr", {path: "/"});
    expect(dispatch).toHaveBeenCalledWith({
      payload: false,
      type: types.SET_AUTHENTICATION_STATUS,
    });
    action(cookies, "default", true);
    expect(dispatch).toHaveBeenCalledWith({
      payload: false,
      type: types.SET_AUTHENTICATION_STATUS,
    });
  });
  it("should dispatch setUserData action", () => {
    const action = setUserData(dispatch);
    action({username: "openwisp"});
    expect(dispatch).toHaveBeenCalledWith({
      payload: {username: "openwisp"},
      type: types.SET_USER_DATA,
    });
  });
  it("should dispatch setInteretMode action", () => {
    const action = setInternetMode(dispatch);
    action(true);
    expect(dispatch).toHaveBeenCalledWith({
      payload: true,
      type: types.SET_INTERNET_MODE,
    });
  });
  it("should dispatch setPlanExhausted action", () => {
    const action = setPlanExhausted(dispatch);
    action(true);
    expect(dispatch).toHaveBeenCalledWith({
      payload: true,
      type: types.SET_PLAN_EXHAUSTED,
    });
  });
});
