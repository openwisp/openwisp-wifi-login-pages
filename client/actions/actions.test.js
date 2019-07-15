import merge from "deepmerge";
import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

import * as types from "../constants/action-types";
import testOrgConfig from "../test-config.json";
import parseOrganizations from "./parse-organizations";
import setLanguage from "./set-language";
import setOrganization from "./set-organization";

jest.mock("../utils/get-config");
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

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
        type: types.SET_ORGANIZATION_STATUS,
        payload: false,
      },
    ];
    const store = mockStore({language: "", organization: {}});
    store.dispatch(setOrganization(testOrgConfig[2].slug));
    store.dispatch(setOrganization("invalid-slug"));
    expect(store.getActions()).toEqual(expectedActions);
  });
});
