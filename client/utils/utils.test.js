import React from "react";
import axios from "axios";
import {Cookies} from "react-cookie";
import {shallow, mount} from "enzyme";
import * as dependency from "react-toastify";
import authenticate from "./authenticate";
import isInternalLink from "./check-internal-links";
import customMerge from "./custom-merge";
import getParameterByName from "./get-parameter-by-name";
import renderAdditionalInfo from "./render-additional-info";
import shouldLinkBeShown from "./should-link-be-shown";
import tick from "./tick";
import validateToken from "./validate-token";
import loadTranslation from "./load-translation";
import PasswordToggleIcon from "./password-toggle";
import submitOnEnter from "./submit-on-enter";
import handleSession from "./session";
import sortOrganizations from "./sort-organizations";
import logError from "./log-error";
import needsVerify from "./needs-verify";
import loader from "./loader";
import handleChange from "./handle-change";

jest.mock("axios");
jest.mock("./load-translation");

describe("renderAdditionalInfo tests", () => {
  let text = "sample test";
  const orgSlug = "default";
  const component = "test";
  loadTranslation("en", "default");
  it("should return expected output", () => {
    let output = renderAdditionalInfo(text, orgSlug, component);
    expect(output[0]).toEqual("sample test");
    text = "sample {terms_and_conditions} test";
    output = renderAdditionalInfo(text, orgSlug, component);
    expect(output[1].props.children).toBe("terms and conditions");
    text = "sample {privacy_policy} test";
    output = renderAdditionalInfo(text, orgSlug, component);
    expect(output[1].props.children).toBe("privacy policy");
    text = "sample {privacy_policy} test {terms_and_conditions}";
    output = renderAdditionalInfo(text, orgSlug, component);
    expect(output[1].props.children).toBe("privacy policy");
    expect(output[3].props.children).toBe("terms and conditions");

    text = "{terms_and_conditions} sample {privacy_policy} test";
    output = renderAdditionalInfo(text, orgSlug, component);
    expect(output[1].props.children).toBe("terms and conditions");
    expect(output[3].props.children).toBe("privacy policy");
  });
});
describe("customMerge tests", () => {
  const arr1 = ["test1", "test2"];
  const arr2 = ["test3", "test4"];
  it("should return expected output", () => {
    expect(customMerge(arr1, arr2)).toEqual(arr2);
  });
});
describe("authenticate tests", () => {
  let cookies = {
    get: jest
      .fn()
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false),
  };
  const orgSlug = "test-org";
  it("should perform authentication", () => {
    expect(authenticate(cookies, orgSlug)).toEqual(true);
    expect(authenticate(cookies, orgSlug)).toEqual(false);
  });
  it("should clear cookies if sessionKey is used", () => {
    cookies = {
      remove: jest.fn(),
      get: jest.fn(),
    };
    const sessionKey = "sessionKey";
    sessionStorage.setItem(`${orgSlug}_auth_token`, sessionKey);
    expect(authenticate(cookies, orgSlug)).toBe(true);
    expect(cookies.remove).toHaveBeenCalledWith(`${orgSlug}_auth_token`, {
      path: "/",
    });
    expect(cookies.remove).toHaveBeenCalledWith(`${orgSlug}_username`, {
      path: "/",
    });
    expect(cookies.get).toHaveBeenCalledWith(`${orgSlug}_auth_token`);
  });
});
describe("isInternalLink tests", () => {
  it("should detect internal links", () => {
    expect(isInternalLink("/default/login")).toEqual(true);
    expect(isInternalLink("https://google.com")).toEqual(false);
  });
});
describe("getParameterByName tests", () => {
  it("should get parameter values", () => {
    expect(getParameterByName("username")).toBe(null);
    expect(
      getParameterByName("username", "/default/login?username=vivek"),
    ).toBe("vivek");
  });
});
describe("shouldLinkBeShown tests", () => {
  const createArgs = (link, isAuthenticated, userData) => ({
    link,
    isAuthenticated,
    userData,
  });

  it("test link.authenticated is undefined", () => {
    const {link, isAuthenticated, userData} = createArgs({}, false, {});
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(true);
  });
  it("test link.authenticated is different from isAuthenticated", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: false},
      true,
      {},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(false);
  });
  it("test link.authenticated is similar to isAuthenticated", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true},
      true,
      {},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(true);
  });
  it("should return false if user is unverified but authenticated and link.verified is true", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true, verified: true},
      true,
      {is_verified: false},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(false);
  });
  it("should return false if user is authenticated and link.method is not equal to userData.method", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true, method: "payment"},
      true,
      {method: "mobile_phone"},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(false);
  });
  it("should return true if userData.method and link.method is same", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true, method: "payment"},
      true,
      {method: "payment"},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(true);
  });
});
describe("tick tests", () => {
  it("test tick", async () => {
    jest.spyOn(process, "nextTick");
    await tick();
    expect(process.nextTick).toHaveBeenCalled();
  });
});
describe("Validate Token tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  const getArgs = () => ({
    orgSlug: "default",
    cookies: new Cookies(),
    setUserData: jest.fn(),
    userData: {is_active: true, is_verified: null, justAuthenticated: true},
    logout: jest.fn(),
  });
  it("should return false if token is not in the cookie", async () => {
    const {orgSlug, cookies, setUserData, userData, logout} = getArgs();
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    expect(axios.mock.calls.length).toBe(0);
    expect(result).toBe(false);
    expect(setUserData.mock.calls.length).toBe(1);
    expect(logout.mock.calls.length).toBe(1);
  });
  it("should return true for success validation", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
          radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
          username: "tester@tester.com",
          is_active: true,
          is_verified: true,
          phone_number: "+393660011222",
        },
      }),
    );
    const {orgSlug, cookies, setUserData, userData, logout} = getArgs();
    cookies.set(`${orgSlug}_auth_token`, "token");
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    expect(axios).toHaveBeenCalled();
    expect(setUserData.mock.calls.length).toBe(1);
    expect(result).toBe(true);
    expect(logout.mock.calls.length).toBe(0);
  });
  it("should return true without calling api if radius token is present", async () => {
    const {orgSlug, cookies, setUserData, userData, logout} = getArgs();
    userData.radius_user_token = "token";
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    expect(axios.mock.calls.length).toBe(0);
    expect(result).toBe(true);
    expect(setUserData.mock.calls.length).toBe(0);
    expect(logout.mock.calls.length).toBe(0);
  });
  it("should return false when internal server error", async () => {
    const response = {
      status: 500,
      statusText: "INTERNAL_SERVER_ERROR",
      data: {
        response_code: "INTERNAL_SERVER_ERROR",
      },
    };
    jest.spyOn(global.console, "log").mockImplementation();
    axios.mockImplementationOnce(() => Promise.resolve(response));
    const errorMethod = jest.spyOn(dependency.toast, "error");
    const {orgSlug, cookies, setUserData, userData, logout} = getArgs();
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    expect(axios.mock.calls.length).toBe(1);
    expect(result).toBe(false);
    expect(setUserData.mock.calls.length).toBe(1);
    expect(errorMethod).toBeCalledWith("Error occurred!");
    expect(logout).toHaveBeenCalledWith(
      {
        HAS_DOCUMENT_COOKIE: true,
        changeListeners: [],
        cookies: {default_auth_token: "token"},
      },
      "default",
    );
    expect(console.log).toHaveBeenCalledWith(response);
  });
  it("should show error toast on invalid token", async () => {
    const response = {
      status: 401,
      statusText: "BLANK_OR_INVALID_TOKEN",
      data: {
        response_code: "BLANK_OR_INVALID_TOKEN",
      },
    };
    axios.mockImplementationOnce(() => Promise.reject(response));
    jest.spyOn(global.console, "log").mockImplementation();
    const errorMethod = jest.spyOn(dependency.toast, "error");
    const {orgSlug, cookies, setUserData, userData, logout} = getArgs();
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    expect(result).toEqual(false);
    expect(errorMethod).toBeCalledWith("Error occurred!");
    expect(logout).toHaveBeenCalledWith(
      {
        HAS_DOCUMENT_COOKIE: true,
        changeListeners: [],
        cookies: {default_auth_token: "token"},
      },
      "default",
    );
    expect(setUserData.mock.calls.length).toBe(1);
    expect(console.log).toHaveBeenCalledWith(response);
    expect(setUserData.mock.calls.pop()).toEqual([
      {is_active: true, is_verified: null, justAuthenticated: true},
    ]);
  });
});
describe("password-toggle tests", () => {
  const Component = React.forwardRef((props, ref) => (
    <>
      <input type="password" ref={ref} />
      <PasswordToggleIcon inputRef={ref} />
    </>
  ));
  const mountComponent = (ref) => mount(<Component ref={ref} />);
  it("should show and hide password", () => {
    const passwordRef = React.createRef();
    const component = mountComponent(passwordRef);
    const toggleDiv = component.find("div");
    expect(passwordRef.current.getAttribute("type")).toEqual("password");
    expect(toggleDiv.instance().children[0].getAttribute("class")).toEqual(
      "eye",
    );
    toggleDiv.simulate("click");
    expect(passwordRef.current.getAttribute("type")).toEqual("text");
    expect(toggleDiv.instance().children[0].getAttribute("class")).toEqual(
      "eye-slash",
    );
  });
  it("should call handleClick", () => {
    const setAttributeMock = jest.fn();
    const getAttributeMock = jest.fn();
    const focusMock = jest.fn();
    const inputRef = {
      current: {
        getAttribute: getAttributeMock,
        setAttribute: setAttributeMock,
        focus: focusMock,
      },
    };
    const wrapper = shallow(<PasswordToggleIcon inputRef={inputRef} />);

    wrapper.instance().handleClick(inputRef, {});
    expect(getAttributeMock).toHaveBeenCalledWith("type");
    expect(setAttributeMock).toHaveBeenCalled();
    expect(setAttributeMock).toHaveBeenCalledWith("type", "password");
    expect(focusMock).toHaveBeenCalled();
  });
  it("should show password for two fields", () => {
    const setAttributeMock = jest.fn();
    const getAttributeMock = jest.fn();
    const focusMock = jest.fn();
    const inputRef = {
      current: {
        getAttribute: getAttributeMock,
        setAttribute: setAttributeMock,
        focus: focusMock,
      },
    };
    const secondInputRef = {
      current: {
        getAttribute: jest.fn(),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      },
    };
    const toggler = jest.fn();
    const wrapper = shallow(
      <PasswordToggleIcon
        inputRef={inputRef}
        secondInputRef={secondInputRef}
        toggler={toggler}
        hidePassword
      />,
    );
    wrapper.instance().handleClick(inputRef, secondInputRef);
    expect(getAttributeMock).toHaveBeenCalledWith("type");
    expect(secondInputRef.current.getAttribute).toHaveBeenCalledWith("type");
    expect(setAttributeMock).toHaveBeenCalledWith("type", "password");
    expect(secondInputRef.current.setAttribute).toHaveBeenCalledWith(
      "type",
      "password",
    );
    expect(focusMock).toHaveBeenCalled();
    expect(secondInputRef.current.focus).not.toHaveBeenCalled();
    getAttributeMock.mockReturnValueOnce("password");
    secondInputRef.current.getAttribute.mockReturnValueOnce("password");
    wrapper.instance().handleClick(inputRef, secondInputRef);
    expect(getAttributeMock).toHaveBeenCalledWith("type");
    expect(secondInputRef.current.getAttribute).toHaveBeenCalledWith("type");
    expect(setAttributeMock).toHaveBeenCalledWith("type", "text");
    expect(secondInputRef.current.setAttribute).toHaveBeenCalledWith(
      "type",
      "text",
    );
    expect(focusMock).toHaveBeenCalled();
    expect(secondInputRef.current.focus).not.toHaveBeenCalled();
    expect(toggler).toHaveBeenCalled();
  });
  it("should show icon", () => {
    const setAttributeMock = jest.fn();
    const getAttributeMock = jest.fn();
    const focusMock = jest.fn();
    const inputRef = {
      current: {
        getAttribute: getAttributeMock,
        setAttribute: setAttributeMock,
        focus: focusMock,
      },
    };
    const secondInputRef = {
      current: {
        getAttribute: jest.fn(),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      },
    };
    const toggler = jest.fn();
    let wrapper = shallow(
      <PasswordToggleIcon
        inputRef={inputRef}
        secondInputRef={secondInputRef}
        toggler={toggler}
        hidePassword
      />,
    );
    expect(
      wrapper.contains(<i className="eye" title="reveal password" />),
    ).toEqual(true);
    wrapper = shallow(
      <PasswordToggleIcon
        inputRef={inputRef}
        secondInputRef={secondInputRef}
        toggler={toggler}
        hidePassword={false}
      />,
    );
    expect(
      wrapper.contains(<i className="eye-slash" title="hide password" />),
    ).toEqual(true);
    wrapper.instance().handleClick(inputRef, secondInputRef);
    expect(toggler).toHaveBeenCalled();
  });
});
describe("submit-on-enter tests", () => {
  document.body.innerHTML = `<form id="formID">
    <input type="email">
    <input type="submit">
    </form>`;
  const event = {keyCode: 13};
  it("should call handleSubmit", () => {
    const spyFn = jest.fn();
    const instance = {handleSubmit: spyFn};
    submitOnEnter(event, instance, "formID");
    expect(spyFn).toHaveBeenCalled();
  });
  it("should call getElementById", () => {
    const spyFn = jest.fn();
    spyFn.mockReturnValueOnce({reportValidity: () => {}});
    const instance = {handleSubmit: () => {}};
    document.getElementById = spyFn;
    submitOnEnter(event, instance, "formID");
    expect(spyFn).toHaveBeenCalledWith("formID");
  });
  it("should not call anything if enter is not pressed", () => {
    event.keyCode = 18;
    const spyFn = jest.fn();
    const instance = {handleSubmit: spyFn};
    submitOnEnter(event, instance, "formID");
    expect(spyFn.mock.calls.length).toBe(0);
  });
});
describe("handleSession tests", () => {
  const orgSlug = "default";
  const token = "token";
  it("should clear auth_token cookie if sessionKey is present", () => {
    const spyFn = jest.fn();
    const cookies = {
      remove: spyFn,
    };
    sessionStorage.setItem(`${orgSlug}_auth_token`, token);
    handleSession(orgSlug, token, cookies);
    expect(spyFn).toHaveBeenCalledWith(`${orgSlug}_auth_token`, {path: "/"});
  });
});
describe("sort organizations tests", () => {
  it("should sort organization with compareFunc", () => {
    const organizations = [{slug: "mobile"}, {slug: "default"}];
    expect(sortOrganizations(organizations)).toEqual([
      {slug: "default"},
      {slug: "mobile"},
    ]);
  });
});
describe("log-error tests", () => {
  let consoleLog;
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(global.console, "error").mockImplementation();
    consoleLog = jest.spyOn(global.console, "log").mockImplementation();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should log on executing logError", () => {
    logError("normal log");
    expect(consoleLog).toHaveBeenCalledWith("normal log");
    expect(consoleError.mock.calls.length).toEqual(0);
  });
  it("should log error on executing logError with error response", () => {
    logError(
      {response: {status: "400", statusText: "Bad request"}},
      "Invalid Credentials",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "Status",
      "400",
      "Bad request",
      ":",
      "Invalid Credentials",
    );
    expect(consoleLog.mock.calls.length).toEqual(0);
  });
});
describe("needs-verify tests", () => {
  let settings;
  let userData;
  beforeEach(() => {
    settings = {mobile_phone_verification: true, subscriptions: true};
    userData = {is_active: true, is_verified: false};
  });
  it("should return false if method is none", () => {
    expect(needsVerify("", {}, {})).toBe(false);
  });
  it("should return false if user is verified but not active", () => {
    expect(needsVerify("", {is_active: false, is_verified: true}, {})).toBe(
      false,
    );
  });
  it("should return true or false for mobile_phone method", () => {
    const method = "mobile_phone";
    userData.method = method;
    expect(needsVerify(method, userData, settings)).toBe(true);
    userData.is_verified = true;
    expect(needsVerify(method, userData, settings)).toBe(false);
  });
  it("should return true or false for bank_card method", () => {
    const method = "bank_card";
    userData.method = method;
    expect(needsVerify(method, userData, settings)).toBe(false);
    userData.payment_url = "https://payment/";
    expect(needsVerify(method, userData, settings)).toBe(true);
  });
});
describe("loader tests", () => {
  it("should show loader with class full-page-loader-container", () => {
    const wrapper = shallow(loader({full: true}));
    expect(
      wrapper.contains(
        <div className="full-page-loader-container">
          <div className="loader" />
        </div>,
      ),
    ).toBe(true);
  });
  it("should show loader with class loader-container", () => {
    const wrapper = shallow(loader({full: false}));
    expect(
      wrapper.contains(
        <div className="loader-container">
          <div className="loader" />
        </div>,
      ),
    ).toBe(true);
  });
});
describe("handle-change tests", () => {
  const event = {
    target: {
      name: "email",
      value: "openwisp@openwisp.org",
    },
  };
  const instance = {
    setState: jest.fn(),
    state: {
      errors: [],
    },
  };
  it("should execute handleChange normally", () => {
    handleChange(event, instance);
    expect(instance.setState).toHaveBeenCalledWith({
      email: "openwisp@openwisp.org",
      username: "openwisp",
    });
  });
  it("should delete errors on correct value", () => {
    instance.state.errors.email = "Invalid Email";
    instance.state.errors.nonField = "Email existw";
    handleChange(event, instance);
    expect(instance.state.errors).toEqual([]);
  });
});
