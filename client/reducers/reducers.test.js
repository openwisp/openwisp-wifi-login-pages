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
        is_verified: null,
        mustLogin: true,
        mustLogout: false,
        repeatLogin: false,
        auth_token: undefined,
        radius_user_token: undefined,
      },
      settings: {
        mobile_phone_verification: undefined,
        subscriptions: undefined,
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
  it("should handle SET_PAGE_TITLE", () => {
    const action = {
      type: types.SET_PAGE_TITLE,
      payload: "default name",
    };
    expect(organization(initialState, action)).toEqual({
      ...initialState,
      configuration: {
        ...initialState.configuration,
        pageTitle: action.payload,
      },
    });
  });
  it("should handle SET_USER_DATA", () => {
    const userData = {
      is_active: true,
      is_verified: true,
      method: "mobile_phone",
      email: "tester@test.com",
      phone_number: "+393664050800",
      username: "+393664050800",
      key: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
      radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
      first_name: "",
      last_name: "",
      birth_date: null,
      location: "",
    };
    const action = {
      type: types.SET_USER_DATA,
      payload: userData,
    };
    expect(organization(initialState, action)).toEqual({
      ...initialState,
      configuration: {
        ...initialState.configuration,
        userData: action.payload,
      },
    });
  });
});
