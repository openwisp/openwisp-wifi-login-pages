import * as types from "../constants/action-types";
import testConfig from "../test-config.json";
import language from "./language";
import {organization, organizations} from "./organization";

describe("language reducer", () => {
  it("should return initial state", () => {
    expect(language(undefined, {})).toEqual("");
  });

  it("should handle SET_LANGUAGE", () => {
    const action = {type: types.SET_LANGUAGE, payload: "en"};
    expect(language("", action)).toEqual("en");
  });
});

describe("organizations reducer", () => {
  it("should return initial state", () => {
    expect(organizations(undefined, {})).toEqual([]);
  });

  it("should handle PARSE_ORGANIZATIONS", () => {
    const action = {type: types.PARSE_ORGANIZATIONS, payload: testConfig};
    expect(organizations([], action)).toEqual(testConfig);
  });
});

describe("organization reducer", () => {
  const initialState = {
    exists: undefined,
    configuration: {
      userData: {
        is_active: true,
        is_verified: true,
      },
      settings: {
        mobile_phone_verification: undefined,
      },
    },
  };
  it("should return initial state", () => {
    expect(organization(undefined, {})).toEqual(initialState);
  });

  it("should handle SET_ORGANIZATION_CONFIG", () => {
    let action = {
      type: types.SET_ORGANIZATION_CONFIG,
      payload: testConfig[0],
    };
    expect(organization(initialState, action)).toEqual({
      ...initialState,
      configuration: action.payload,
    });
    action = {
      type: types.SET_ORGANIZATION_STATUS,
      payload: true,
    };
    expect(organization(initialState, action)).toEqual({
      ...initialState,
      exists: action.payload,
    });
  });
  it("should handle SET_AUTHENTICATION_STATUS", () => {
    const action = {
      type: types.SET_AUTHENTICATION_STATUS,
      payload: false,
    };
    expect(organization(initialState, action)).toEqual({
      ...initialState,
      configuration: {
        ...initialState.configuration,
        isAuthenticated: action.payload,
      },
    });
  });
});
