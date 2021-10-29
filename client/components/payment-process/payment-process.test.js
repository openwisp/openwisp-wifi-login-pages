/* eslint-disable prefer-promise-reject-errors */
import {shallow} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {Cookies} from "react-cookie";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import PaymentProcess from "./payment-process";
import tick from "../../utils/tick";
import validateToken from "../../utils/validate-token";
import loadTranslation from "../../utils/load-translation";
import getPaymentStatusRedirectUrl from "../../utils/get-payment-status";
import history from "../../utils/history";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/history");
jest.mock("../../utils/get-payment-status");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  userData: {},
  setUserData: jest.fn(),
  page: defaultConfig.components.payment_status_page,
  cookies: new Cookies(),
  settings: {subscriptions: true},
  logout: jest.fn(),
  authenticate: jest.fn(),
  isAuthenticated: true,
  ...props,
});
const responseData = {
  response_code: "AUTH_TOKEN_VALIDATION_SUCCESSFUL",
  is_active: true,
  is_verified: false,
  method: "bank_card",
  email: "tester@test.com",
  phone_number: null,
  username: "tester",
  key: "b72dad1cca4807dc21c00b0b2f171d29415ac541",
  radius_user_token: "jwyVSZYOze16ej6cc1AW5cxhRjahesLzh1Tm2y0d",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
  payment_url: "https://account.openwisp.io/payment/123",
};

describe("Test <PaymentProcess /> cases", () => {
  let props;
  let wrapper;
  const originalLog = console.log;

  beforeEach(() => {
    props = createTestProps();
    PaymentProcess.contextTypes = {
      setLoading: PropTypes.func,
    };
    console.log = jest.fn();
    console.error = jest.fn();
    getPaymentStatusRedirectUrl.mockClear();
    loadTranslation("en", "default");
    validateToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    console.log = originalLog;
  });

  it("should redirect users registered with other methods", async () => {
    props = createTestProps({
      userData: {...responseData, method: "phone_number"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });

  it("should redirect verified users", async () => {
    props = createTestProps({
      userData: {...responseData, is_verified: true},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });

  it("should redirect if payment_url is not present", async () => {
    props = createTestProps({
      userData: {...responseData, payment_url: null},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });

  it("should redirect unauthenticated users", async () => {
    props = createTestProps({
      isAuthenticated: false,
      userData: responseData
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });

  it("should redirect if token is invalid", async () => {
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockReturnValue(false);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
  });

  it("should render payment_url in iframe", async () => {
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper).toMatchSnapshot();
  });

  it("test postMessage event listener firing", async () => {
    props = createTestProps();
    const events = {};
    window.addEventListener = jest.fn((event, callback) => {
      events[event] = callback;
    });
    window.removeEventListener = jest.fn((event, callback) => {
      if (events[event] === callback) {
        events[event] = jest.fn();
      }
    });
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const paymentProcess = wrapper.instance()
    const handlePostMessageMock = jest.fn();
    paymentProcess.handlePostMessage = handlePostMessageMock;
    paymentProcess.componentDidMount();
    await tick();
    events.message({
      type: "paymentSuccess",
      message: {paymentId: "paymentId"},
    });
    expect(handlePostMessageMock).toHaveBeenCalledTimes(1);
    paymentProcess.componentWillUnmount();
    events.message({
      type: "paymentSuccess",
      message: {paymentId: "paymentId"},
    });
    expect(handlePostMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should redirect to /payment/:status on completed transaction", async () => {
    props = createTestProps({userData: responseData});
    getPaymentStatusRedirectUrl.mockReturnValue(
      `/${props.orgSlug}/payment/success/`,
    );
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const {handlePostMessage} = wrapper.instance();
    await handlePostMessage({
      data: {
        type: "paymentSuccess",
        message: {paymentId: "paymentId"},
      },
      origin: "http://localhost",
    });
    expect(history.push).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/success/`,
    );
  });
});
