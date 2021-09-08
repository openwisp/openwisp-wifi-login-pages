import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

import * as types from "../constants/action-types";
import testOrgConfig from "../test-config.json";
import {
  setTitleAction,
  authenticate,
  logout as logoutAction,
  setUserData,
} from "./dispatchers";
import logout from "./logout";
import parseOrganizations from "./parse-organizations";
import setLanguage from "./set-language";
import setOrganization from "./set-organization";
import {initialState} from "../reducers/organization";

jest.mock("../utils/get-config");
jest.mock("../utils/authenticate");
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
});
