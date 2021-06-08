import merge from "deepmerge";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

import * as types from "../constants/action-types";
import testOrgConfig from "../test-config.json";
import logout from "./logout";
import parseOrganizations from "./parse-organizations";
import setLanguage from "./set-language";
import setOrganization from "./set-organization";

jest.mock("../utils/get-config");
jest.mock("../utils/authenticate");
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const cookies = {
  get: jest.fn().mockImplementationOnce(() => true),
  remove: jest.fn(),
};
describe("actions testing", () => {
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

  it("should create actions to set current organization", () => {
    const orgConfig = merge(testOrgConfig[0], testOrgConfig[2]);
    const orgConfig2 = merge(testOrgConfig[0], testOrgConfig[1]);

    const expectedActions = [
      {
        type: types.SET_LANGUAGE,
        payload: testOrgConfig[0].default_language,
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
        payload: {},
      },
      {
        type: types.SET_LANGUAGE,
        payload: testOrgConfig[1].default_language,
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
        payload: {},
      },
      {
        type: types.SET_LANGUAGE,
        payload: testOrgConfig[0].default_language,
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
        payload: {},
      },
      {
        type: types.SET_AUTHENTICATION_STATUS,
        payload: true,
      },
      {
        type: types.IS_ACTIVE,
        payload: true,
      },
      {
        type: types.SET_ORGANIZATION_STATUS,
        payload: false,
      },
    ];
    const store = mockStore({language: "", organization: {}});
    store.dispatch(setOrganization(testOrgConfig[2].slug, cookies));
    store.dispatch(setOrganization(testOrgConfig[1].slug, cookies));
    store.dispatch(setOrganization(testOrgConfig[0].slug, cookies));
    store.dispatch(setOrganization("invalid-slug"));
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
});
