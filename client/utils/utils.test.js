import React from "react";
import PropTypes from "prop-types";
import {MemoryRouter} from "react-router-dom";
import axios from "axios";
import {Cookies} from "react-cookie";
import {render, screen, fireEvent} from "@testing-library/react";
import "@testing-library/jest-dom";
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
import redirectToPayment from "./redirect-to-payment";
import {initialState} from "../reducers/organization";
import {localStorage, sessionStorage, storageFallback} from "./storage";
import getPaymentStatusRedirectUrl from "./get-payment-status";
import withRouteProps from "./with-route-props";

jest.mock("axios");
jest.mock("./load-translation");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: () => ({
    pathname: "/path",
  }),
  useNavigate: () => jest.fn(),
}));

describe("renderAdditionalInfo tests", () => {
  let text = "sample test";
  const orgSlug = "default";
  const component = "test";
  loadTranslation("en", "default");
  it("should return expected output", () => {
    let result;
    result = renderAdditionalInfo(text, orgSlug, component);
    expect(result[0]).toEqual("sample test");
    text = "sample {terms_and_conditions} test";
    result = renderAdditionalInfo(text, orgSlug, component);
    expect(result[1]).toHaveProperty("props");
    expect(result[1].props).toHaveProperty("children", "terms and conditions");
    text = "sample {privacy_policy} test";
    result = renderAdditionalInfo(text, orgSlug, component);
    expect(result[1]).toHaveProperty("props");
    expect(result[1].props).toHaveProperty("children", "privacy policy");
    text = "sample {privacy_policy} test {terms_and_conditions}";
    result = renderAdditionalInfo(text, orgSlug, component);
    expect(result[1]).toHaveProperty("props");
    expect(result[1].props).toHaveProperty("children", "privacy policy");
    expect(result[3]).toHaveProperty("props");
    expect(result[3].props).toHaveProperty("children", "terms and conditions");

    text = "{terms_and_conditions} sample {privacy_policy} test";
    result = renderAdditionalInfo(text, orgSlug, component);
    expect(result[1]).toHaveProperty("props");
    expect(result[1].props).toHaveProperty("children", "terms and conditions");
    expect(result[3]).toHaveProperty("props");
    expect(result[3].props).toHaveProperty("children", "privacy policy");
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
  it("should return false if user is authenticated and userData.method is not in link.methods_only", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true, methods_only: ["payment"]},
      true,
      {method: "mobile_phone"},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(false);
  });
  it("should return true if userData.method is in link.methods_only", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true, methods_only: ["payment"]},
      true,
      {method: "payment"},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(true);
  });
  it("should return false if userData.method is in link.methods_excluded", () => {
    const {link, isAuthenticated, userData} = createArgs(
      {authenticated: true, methods_excluded: ["payment"]},
      true,
      {method: "payment"},
    );
    expect(shouldLinkBeShown(link, isAuthenticated, userData)).toBe(false);
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
    userData: {is_active: true, is_verified: null, mustLogin: true},
    logout: jest.fn(),
    language: "en",
  });
  it("should return false if token is not in the cookie", async () => {
    const {orgSlug, cookies, setUserData, userData, logout, language} =
      getArgs();
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
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
    const {orgSlug, cookies, setUserData, userData, logout, language} =
      getArgs();
    cookies.set(`${orgSlug}_auth_token`, "token");
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    expect(axios).toHaveBeenCalled();
    expect(setUserData.mock.calls.length).toBe(1);
    expect(result).toBe(true);
    expect(logout.mock.calls.length).toBe(0);
  });
  it("should return true without calling api if radius token is present", async () => {
    const {orgSlug, cookies, setUserData, userData, logout, language} =
      getArgs();
    userData.radius_user_token = "token";
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    expect(axios.mock.calls.length).toBe(0);
    expect(result).toBe(true);
    expect(setUserData.mock.calls.length).toBe(0);
    expect(logout.mock.calls.length).toBe(0);
  });
  it("should make api call if radius token is present but password_expired is true", async () => {
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
    const {orgSlug, cookies, setUserData, userData, logout, language} =
      getArgs();
    cookies.set(`${orgSlug}_auth_token`, "token");
    userData.password_expired = true;
    userData.radius_user_token = "token";
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    expect(axios).toHaveBeenCalled();
    expect(setUserData.mock.calls.length).toBe(1);
    expect(result).toBe(true);
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
    const {orgSlug, cookies, setUserData, userData, logout, language} =
      getArgs();
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    expect(axios.mock.calls.length).toBe(1);
    expect(result).toBe(false);
    expect(setUserData.mock.calls.length).toBe(1);
    expect(errorMethod).toHaveBeenCalledWith("Error occurred!");
    expect(logout).toHaveBeenCalledWith(expect.any(Cookies), "default");
    const cookiesArg = logout.mock.calls[0][0];
    expect(cookiesArg.cookies).toEqual({default_auth_token: "token"});
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
    const {orgSlug, cookies, setUserData, userData, logout, language} =
      getArgs();
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    expect(result).toEqual(false);
    expect(errorMethod).toHaveBeenCalledWith("Error occurred!");
    expect(logout).toHaveBeenCalledWith(expect.any(Cookies), "default");
    const cookiesArg = logout.mock.calls[0][0];
    expect(cookiesArg.cookies).toEqual({default_auth_token: "token"});
    expect(setUserData.mock.calls.length).toBe(1);
    expect(console.log).toHaveBeenCalledWith(response);
    expect(setUserData.mock.calls.pop()).toEqual([initialState.userData]);
  });
  it("should show error if user is locked out", async () => {
    const responseError = {
      response: {
        status: 403,
        data: {
          detail: "Your account has been locked.",
        },
      },
    };
    axios.mockImplementationOnce(() => Promise.reject(responseError));
    const errorMethod = jest.spyOn(dependency.toast, "error");
    const {orgSlug, cookies, setUserData, userData, logout} = getArgs();
    cookies.set(`${orgSlug}_auth_token`, "token");
    const result = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    expect(result).toEqual(false);
    expect(errorMethod).toHaveBeenCalledWith(
      responseError.response.data.detail,
      {
        toastId: "main_toast_id",
      },
    );
    expect(logout).toHaveBeenCalledWith(expect.any(Cookies), "default");
    const cookiesArg = logout.mock.calls[0][0];
    expect(cookiesArg.cookies).toEqual({default_auth_token: "token"});
    expect(setUserData.mock.calls.length).toBe(1);
    expect(setUserData.mock.calls.pop()).toEqual([initialState.userData]);
  });
});

describe("password-toggle tests", () => {
  it("should call handleClick", () => {
    const setAttributeMock = jest.fn();
    const getAttributeMock = jest.fn().mockReturnValue("password");
    const focusMock = jest.fn();
    const inputRef = {
      current: {
        getAttribute: getAttributeMock,
        setAttribute: setAttributeMock,
        focus: focusMock,
      },
    };
    render(
      <PasswordToggleIcon
        inputRef={inputRef}
        parentClassName="password-toggle"
      />,
    );

    // Click the toggle icon
    const toggleIcon = screen.getByTestId("password-toggle-icon");
    expect(toggleIcon).toBeInTheDocument();
    fireEvent.click(toggleIcon);

    expect(getAttributeMock).toHaveBeenCalledWith("type");
    expect(setAttributeMock).toHaveBeenCalled();
    expect(focusMock).toHaveBeenCalled();
  });

  it("should show password for two fields", () => {
    const setAttributeMock = jest.fn();
    const getAttributeMock = jest.fn().mockReturnValue("password");
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
        getAttribute: jest.fn().mockReturnValue("password"),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      },
    };
    const toggler = jest.fn();
    render(
      <PasswordToggleIcon
        inputRef={inputRef}
        secondInputRef={secondInputRef}
        toggler={toggler}
        hidePassword
        parentClassName="password-toggle"
      />,
    );

    // Click the toggle icon
    const toggleIcon = screen.getByTestId("password-toggle-icon");
    expect(toggleIcon).toBeInTheDocument();
    fireEvent.click(toggleIcon);

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
    const inputRef = {
      current: {
        getAttribute: jest.fn().mockReturnValue("password"),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      },
    };
    const secondInputRef = {
      current: {
        getAttribute: jest.fn().mockReturnValue("password"),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      },
    };
    const toggler = jest.fn();

    // Test with hidePassword=true (should show eye icon)
    render(
      <PasswordToggleIcon
        inputRef={inputRef}
        secondInputRef={secondInputRef}
        toggler={toggler}
        hidePassword
      />,
    );
    expect(screen.getByTitle("reveal password")).toBeInTheDocument();

    // Test with hidePassword=false (should show eye-slash icon)
    render(
      <PasswordToggleIcon
        inputRef={inputRef}
        secondInputRef={secondInputRef}
        toggler={toggler}
        hidePassword={false}
      />,
    );
    expect(screen.getByTitle("hide password")).toBeInTheDocument();
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
    const instance = {handleSubmit: () => {}};
    const spyFn = jest
      .spyOn(document, "getElementById")
      .mockReturnValueOnce({reportValidity: () => {}});
    submitOnEnter(event, instance, "formID");
    expect(spyFn).toHaveBeenCalledWith("formID");
    spyFn.mockRestore();
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
  it("should default to .loader-container.full", () => {
    render(loader({}));
    const loaderContainer = screen.getByTestId("loader-container");
    expect(loaderContainer).toBeInTheDocument();
    expect(loaderContainer).toHaveClass("loader-container", "full");
  });

  it("should show .loader-container.full", () => {
    render(loader({full: true}));
    const loaderContainer = screen.getByTestId("loader-container");
    expect(loaderContainer).toBeInTheDocument();
    expect(loaderContainer).toHaveClass("loader-container", "full");
  });

  it("should show .loader-container", () => {
    render(loader({full: false}));
    const loaderContainer = screen.getByTestId("loader-container");
    expect(loaderContainer).toBeInTheDocument();
    expect(loaderContainer).toHaveClass("loader-container");
    expect(loaderContainer).not.toHaveClass("full");
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
  it("should redirectToPayment", () => {
    const navigate = jest.fn();
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <button
          type="submit"
          onClick={() => redirectToPayment("default", navigate)}
        >
          Test
        </button>
      </MemoryRouter>,
    );
    const button = screen.getByRole("button", {name: "Test"});
    fireEvent.click(button);
    expect(navigate).toHaveBeenCalled();
  });
});

describe("storage tests", () => {
  it("should store, get and clear data in window.localStorage", () => {
    localStorage.setItem("organization", "openwisp");
    expect(localStorage.getItem("organization")).toEqual("openwisp");
    localStorage.removeItem("organization");
    expect(localStorage.getItem("organization")).toEqual(null);
    localStorage.setItem("organization", "openwisp");
    localStorage.clear();
    expect(localStorage.getItem("organization")).toEqual(null);
  });
  it("should store, get and clear data in Storage mock", () => {
    const storageMock = storageFallback(null);
    storageMock.setItem("organization", "openwisp");
    expect(storageMock.getItem("organization")).toEqual("openwisp");
    storageMock.removeItem("organization");
    expect(storageMock.getItem("organization")).toEqual(undefined);
    storageMock.setItem("organization", "openwisp");
    storageMock.clear();
    expect(storageMock.getItem("organization")).toEqual(undefined);
  });
});

describe("getPaymentStatusRedirectUrl tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  const getArgs = () => ({
    orgSlug: "default",
    paymentId: "payment-id",
    tokenInfo: {
      type: "Bearer",
      cookies: {
        get: jest.fn(),
        remove: jest.fn(),
      },
    },
    setUserData: jest.fn(),
    userData: {payment_url: "http://localhost:1234"},
  });
  it("should return draft URL if payment status is waiting", async () => {
    const {orgSlug, paymentId, tokenInfo, setUserData, userData} = getArgs();
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          status: "waiting",
        },
      }),
    );
    const result = await getPaymentStatusRedirectUrl(
      orgSlug,
      paymentId,
      tokenInfo,
      setUserData,
      userData,
    );
    expect(result).toBe(`/${orgSlug}/payment/draft`);
  });
  it("should return success URL if payment status is success", async () => {
    const {orgSlug, paymentId, tokenInfo, setUserData, userData} = getArgs();
    const infoToast = jest.spyOn(dependency.toast, "info");
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          status: "success",
          message: "Payment succeeded",
        },
      }),
    );
    const result = await getPaymentStatusRedirectUrl(
      orgSlug,
      paymentId,
      tokenInfo,
      setUserData,
      userData,
    );
    expect(result).toBe(`/${orgSlug}/payment/success`);
    expect(setUserData).toHaveBeenCalledTimes(1);
    expect(setUserData).toHaveBeenCalledWith({
      is_verified: true,
      mustLogin: true,
      payment_url: null,
    });
    expect(infoToast).toHaveBeenCalledTimes(1);
    expect(infoToast).toHaveBeenCalledWith("Payment succeeded");
  });
  it("should return failure URL if payment status is failed", async () => {
    const {orgSlug, paymentId, tokenInfo, setUserData, userData} = getArgs();
    const errorToast = jest.spyOn(dependency.toast, "error");
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        statusText: "OK",
        data: {
          status: "failed",
          message: "Payment failed",
        },
      }),
    );
    const result = await getPaymentStatusRedirectUrl(
      orgSlug,
      paymentId,
      tokenInfo,
      setUserData,
      userData,
    );
    expect(result).toBe(`/${orgSlug}/payment/failed`);
    expect(setUserData).toHaveBeenCalledTimes(1);
    expect(setUserData).toHaveBeenCalledWith({payment_url: null});
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast).toHaveBeenCalledWith("Payment failed");
  });
  it("should log error if request fails", async () => {
    const {orgSlug, paymentId, tokenInfo, setUserData, userData} = getArgs();
    const consoleLog = jest.spyOn(global.console, "log").mockImplementation();
    const errorMethod = jest.spyOn(dependency.toast, "error");
    const response = {
      status: 500,
    };
    axios.mockImplementationOnce(() => Promise.reject(response));
    const result = await getPaymentStatusRedirectUrl(
      orgSlug,
      paymentId,
      tokenInfo,
      setUserData,
      userData,
    );
    expect(result).toBe("/default/payment/failed");
    expect(errorMethod).toHaveBeenCalledTimes(1);
    expect(errorMethod).toHaveBeenCalledWith("Error occurred!");
    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith(response);
  });
  it("should log error if payment object not found", async () => {
    const {orgSlug, paymentId, tokenInfo, setUserData, userData} = getArgs();
    const consoleLog = jest.spyOn(global.console, "log").mockImplementation();
    const errorMethod = jest.spyOn(dependency.toast, "error");
    const response = {
      status: 404,
    };
    axios.mockImplementationOnce(() => Promise.resolve(response));
    const result = await getPaymentStatusRedirectUrl(
      orgSlug,
      paymentId,
      tokenInfo,
      setUserData,
      userData,
    );
    expect(result).toBe("/default/payment/failed");
    expect(errorMethod).toHaveBeenCalledTimes(1);
    expect(errorMethod).toHaveBeenCalledWith("Error occurred!");
    expect(consoleLog).toHaveBeenCalledTimes(1);
    expect(consoleLog).toHaveBeenCalledWith(response);
  });
});

describe("withRouteProps test", () => {
  it("should add route props to component", () => {
    function Component({location, params, navigate, props: componentProps}) {
      // Create a serializable version of props for testing
      const serializableProps = {
        location,
        params,
        navigate: typeof navigate === "function" ? "function" : navigate,
        props: componentProps,
      };
      return (
        <div data-testid="test-component">
          {JSON.stringify(serializableProps)}
        </div>
      );
    }
    Component.propTypes = {
      location: PropTypes.object.isRequired,
      params: PropTypes.object.isRequired,
      navigate: PropTypes.func.isRequired,
      props: PropTypes.object.isRequired,
    };
    const ComponentWithRouteProps = withRouteProps(Component);
    render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ComponentWithRouteProps props={{extra: true}} />
      </MemoryRouter>,
    );

    const component = screen.getByTestId("test-component");
    expect(component).toBeInTheDocument();

    const props = JSON.parse(component.textContent);
    expect(props).toHaveProperty("location");
    expect(props.navigate).toBe("function");
    expect(props).toHaveProperty("params");
    expect(props.props).toEqual({extra: true});
  });
});
