/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow} from "enzyme";
import {toast} from "react-toastify";
import React from "react";
import PropTypes from "prop-types";
import {Cookies} from "react-cookie";
import {loadingContextValue} from "../../utils/loading-context";
import tick from "../../utils/tick";
import getConfig from "../../utils/get-config";
import MobilePhoneVerification from "./mobile-phone-verification";
import validateToken from "../../utils/validateToken";

jest.mock("../../utils/get-config");
jest.mock("../../utils/validateToken");
jest.mock("axios");

const createTestProps = function (props, configName = "test-org-2") {
  const config = getConfig(configName);
  return {
    mobile_phone_verification: config.components.mobile_phone_verification_form,
    settings: config.settings,
    orgSlug: config.slug,
    language: "en",
    cookies: new Cookies(),
    logout: jest.fn(),
    verifyMobileNumber: jest.fn(),
    setIsActive: jest.fn(),
    setUserData: jest.fn(),
    userData: {},
    ...props,
  };
};

const userData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
  radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
  username: "tester@tester.com",
  is_active: false,
  is_verified: false,
  phone_number: "+393660011222",
};

const createShallowComponent = function (props) {
  return shallow(<MobilePhoneVerification {...props} />, {
    context: {...loadingContextValue},
  });
};

const expectVerifyMobileNumber = function (wrapper, callLength, result) {
  const mockedFn = wrapper.instance().props.verifyMobileNumber;
  expect(mockedFn.mock.calls.length).toBe(callLength);
  if (callLength) {
    expect(mockedFn.mock.calls.pop()).toEqual([result]);
  }
  mockedFn.mockReset();
};

describe("Mobile Phone Token verification: standard flow", () => {
  let props;
  let wrapper;
  let lastConsoleOutuput;
  let originalError;
  const event = {preventDefault: jest.fn()};

  beforeEach(() => {
    MobilePhoneVerification.contextTypes = {
      setLoading: PropTypes.func,
    };
    props = createTestProps();
    axios
      // .mockImplementationOnce(() => {
      //   return Promise.resolve({
      //     status: 200,
      //     statusText: "OK",
      //     data: {
      //       response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
      //       radius_user_token: "o6AQLY0aQjD3yuihRKLknTn8krcQwuy2Av6MCsFB",
      //       username: "tester@tester.com",
      //       is_active: false,
      //       is_verified: false,
      //       phone_number: "+393660011222",
      //     },
      //   });
      // })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data: null,
        });
      });
    // console mocking
    validateToken.mockClear();
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
  });

  afterEach(() => {
    axios.mockReset();
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    sessionStorage.clear();
    console.error = originalError;
  });

  it("should render successfully", async () => {
    validateToken.mockReturnValue(true);
    jest.spyOn(MobilePhoneVerification.prototype, "createPhoneToken");

    wrapper = createShallowComponent(props);
    wrapper.setProps({userData});
    await tick();
    expectVerifyMobileNumber(wrapper, 1, true);

    expect(axios).toHaveBeenCalled();
    expect(
      MobilePhoneVerification.prototype.createPhoneToken,
    ).toHaveBeenCalled();
    expect(wrapper).toMatchSnapshot();
    const css = "form";
    expect(wrapper.find(css)).toHaveLength(1);
    expect(wrapper.find(`${css} button[type='submit']`)).toHaveLength(1);
    expect(wrapper.find(`${css} input[type='text']`)).toHaveLength(1);
    expect(
      wrapper.find("form .row .label").text().includes("+393660011222"),
    ).toBe(true);
    expect(wrapper.find(".resend .button")).toHaveLength(1);
    expect(wrapper.find(".change .button")).toHaveLength(1);
    expect(wrapper.find(".logout .button")).toHaveLength(1);
    expect(wrapper.instance().hasPhoneTokenBeenSent()).toBe(true);
  });

  it("should resend token successfully", async () => {
    jest.spyOn(MobilePhoneVerification.prototype, "resendPhoneToken");
    jest.spyOn(toast, "info");
    validateToken.mockReturnValue(true);
    wrapper = createShallowComponent(props);
    await tick();
    expectVerifyMobileNumber(wrapper, 1, true);

    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 201,
        statusText: "CREATED",
        data: null,
      });
    });
    wrapper.find(".resend .button").simulate("click");
    expect(
      MobilePhoneVerification.prototype.resendPhoneToken.mock.calls.length,
    ).toBe(1);
    expect(toast.info.mock.calls.length).toBe(1);
    expectVerifyMobileNumber(wrapper, 0);
  });

  it("should verify token successfully", async () => {
    jest.spyOn(MobilePhoneVerification.prototype, "handleSubmit");
    validateToken.mockReturnValue(true);
    wrapper = createShallowComponent(props);
    wrapper.setProps({userData});
    const setIsActiveMock = wrapper.instance().props.setIsActive.mock;
    await tick();
    expectVerifyMobileNumber(wrapper, 1, true);

    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 200,
        statusText: "OK",
        data: null,
      });
    });
    expect(setIsActiveMock.calls.length).toBe(1);
    wrapper
      .find("form .code input[type='text']")
      .simulate("change", {target: {value: "12345", name: "code"}});
    expect(wrapper.instance().state.code).toBe("12345");
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(setIsActiveMock.calls.length).toBe(2);
    expect(
      MobilePhoneVerification.prototype.handleSubmit.mock.calls.length,
    ).toBe(1);
    expect(event.preventDefault).toHaveBeenCalled();
    expectVerifyMobileNumber(wrapper, 1, false);
  });

  it("should show errors", async () => {
    jest.spyOn(MobilePhoneVerification.prototype, "handleSubmit");
    validateToken.mockReturnValue(true);
    wrapper = createShallowComponent(props);
    const setIsActiveMock = wrapper.instance().props.setIsActive.mock;
    await tick();
    expectVerifyMobileNumber(wrapper, 1, true);
    expect(setIsActiveMock.calls.length).toBe(1);
    axios.mockImplementationOnce(() => {
      return Promise.reject({
        response: {
          status: 400,
          statusText: "BAD REQUEST",
          data: {
            non_field_errors: ["Invalid code."],
          },
        },
      });
    });
    wrapper
      .find("form .code input[type='text']")
      .simulate("change", {target: {value: "12345", name: "code"}});
    expect(wrapper.instance().state.code).toBe("12345");
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(setIsActiveMock.calls.length).toBe(1);
    expect(
      MobilePhoneVerification.prototype.handleSubmit.mock.calls.length,
    ).toBe(1);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(wrapper.instance().state.errors.nonField).toBeTruthy();
    expectVerifyMobileNumber(wrapper, 0);
    expect(lastConsoleOutuput).not.toBe(null);
  });

  it("should log out successfully", async () => {
    jest.spyOn(MobilePhoneVerification.prototype, "handleLogout");
    validateToken.mockReturnValue(true);
    jest.spyOn(toast, "success");

    wrapper = createShallowComponent(props);
    await tick();
    expectVerifyMobileNumber(wrapper, 1, true);

    wrapper.find(".logout .button").simulate("click");
    await tick();
    expect(
      MobilePhoneVerification.prototype.handleLogout.mock.calls.length,
    ).toBe(1);
    expect(wrapper.instance().props.logout.mock.calls.length).toBe(1);
    expect(toast.success.mock.calls.length).toBe(1);
    expectVerifyMobileNumber(wrapper, 0);
  });
});

describe("Mobile Phone Token verification: corner cases", () => {
  let props;
  let wrapper;
  beforeEach(() => {
    MobilePhoneVerification.contextTypes = {
      setLoading: PropTypes.func,
    };
    props = createTestProps();
    validateToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  it("should not proceed if user is already verified", async () => {
    userData.is_active = true;
    userData.is_verified = true;

    jest.spyOn(MobilePhoneVerification.prototype, "createPhoneToken");
    validateToken.mockReturnValue(true);
    wrapper = createShallowComponent(props);
    wrapper.setProps({userData});
    await tick();
    expect(
      MobilePhoneVerification.prototype.createPhoneToken,
    ).not.toHaveBeenCalled();
    expect(wrapper.instance().state.phone_number).toBe("+393660011222");
    const verifyMobileNumberCalls = wrapper.instance().props.verifyMobileNumber
      .mock.calls;
    expect(verifyMobileNumberCalls.length).toBe(1);
    expect(verifyMobileNumberCalls.pop()).toEqual([false]);
  });

  it("should not proceed if mobile verification is not enabled", async () => {
    jest.spyOn(MobilePhoneVerification.prototype, "createPhoneToken");
    validateToken.mockReturnValue(true);
    props.settings.mobile_phone_verification = false;
    wrapper = createShallowComponent(props);
    wrapper.setProps({props});
    await tick();
    expect(
      MobilePhoneVerification.prototype.createPhoneToken,
    ).not.toHaveBeenCalled();
    const verifyMobileNumberCalls = wrapper.instance().props.verifyMobileNumber
      .mock.calls;
    expect(verifyMobileNumberCalls.length).toBe(1);
    expect(verifyMobileNumberCalls.pop()).toEqual([false]);
  });
});
