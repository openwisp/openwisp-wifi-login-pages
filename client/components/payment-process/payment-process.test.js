/* eslint-disable prefer-promise-reject-errors */
import axios from "axios";
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
import {takePaymentReturnContext} from "../../utils/payment";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/history");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  userData: {},
  setUserData: jest.fn(),
  page: defaultConfig.components.payment_status_page,
  cookies: new Cookies(),
  settings: {subscriptions: true, payment_iframe: true},
  logout: jest.fn(),
  authenticate: jest.fn(),
  isAuthenticated: true,
  navigate: jest.fn(),
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
  payment_iframe: true,
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
    loadTranslation("en", "default");
    validateToken.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    console.log = originalLog;
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
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
  });

  it("redirects an unselected payment to gateway selection", async () => {
    const redirectToPaymentUrl = jest.spyOn(
      PaymentProcess.prototype,
      "redirectToPaymentUrl",
    );
    props = createTestProps({
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_gateway: null,
        payment_requires_internet: null,
        payment_iframe: null,
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").prop("to")).toEqual(
      "/default/payment/gateway",
    );
    expect(wrapper.find("iframe")).toHaveLength(0);
    expect(redirectToPaymentUrl).not.toHaveBeenCalled();
  });

  it("redirects an unselected payment before token validation", () => {
    const redirectToPaymentUrl = jest.spyOn(
      PaymentProcess.prototype,
      "redirectToPaymentUrl",
    );
    props = createTestProps({
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_gateway: null,
        payment_requires_internet: null,
        payment_iframe: null,
      },
    });
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    expect(wrapper.state("isTokenValid")).toBe(null);
    expect(wrapper.find("Navigate").prop("to")).toEqual(
      "/default/payment/gateway",
    );
    expect(wrapper.find("iframe")).toHaveLength(0);
    expect(redirectToPaymentUrl).not.toHaveBeenCalled();
  });

  it("keeps a selected internet-requiring payment on the processing page", async () => {
    props = createTestProps({
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_gateway: "online",
        payment_requires_internet: true,
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate")).toHaveLength(0);
    expect(wrapper.find("iframe")).toHaveLength(1);
  });

  it("should redirect unauthenticated users", async () => {
    props = createTestProps({
      isAuthenticated: false,
      userData: responseData,
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
  });

  it("should show loader if token is invalid", async () => {
    const setLoading = jest.fn();
    props = createTestProps({
      userData: responseData,
    });
    validateToken.mockReturnValue(false);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: {setLoading},
    });
    await tick();
    expect(setLoading).toHaveBeenCalledWith(false);
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
    const paymentProcess = wrapper.instance();
    const handlePostMessageMock = jest.fn();
    paymentProcess.handlePostMessage = handlePostMessageMock;
    paymentProcess.componentDidMount();
    await tick();
    events.message({
      type: "paymentClose",
      message: {paymentId: "paymentId"},
    });
    expect(handlePostMessageMock).toHaveBeenCalledTimes(1);
    paymentProcess.componentWillUnmount();
    events.message({
      type: "paymentClose",
      message: {paymentId: "paymentId"},
    });
    expect(handlePostMessageMock).toHaveBeenCalledTimes(1);
  });

  it("should redirect to /payment/:status on completed transaction", async () => {
    props = createTestProps({userData: responseData});
    axios.mockResolvedValueOnce({status: 200, data: {status: "success"}});
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const {handlePostMessage} = wrapper.instance();
    await handlePostMessage({
      data: {
        type: "paymentClose",
        message: {paymentId: "paymentId"},
      },
      origin: "http://localhost",
    });
    expect(props.navigate).toHaveBeenCalledWith(
      `/${props.orgSlug}/payment/success`,
    );
  });

  it.each([
    // A failed registration returns to the failed payment page.
    ["a failed registration", "failed", false, {status: "failed"}],
    // A failed upgrade returns to the failed payment page.
    ["a failed upgrade", "failed", true, {status: "failed"}],
    // A cancelled registration returns to the cancelled payment page.
    [
      "a cancelled registration",
      "cancelled",
      false,
      {status: "failed", reason: "cancelled"},
    ],
    // A cancelled upgrade returns to the cancelled payment page.
    [
      "a cancelled upgrade",
      "cancelled",
      true,
      {status: "failed", reason: "cancelled"},
    ],
  ])(
    "navigates %s to the %s payment page",
    async (_, paymentStatus, inUpgrade, payment) => {
      props = createTestProps({
        userData: {...responseData, in_upgrade: inUpgrade},
      });
      axios.mockResolvedValueOnce({status: 200, data: payment});
      wrapper = shallow(<PaymentProcess {...props} />, {
        context: {setLoading: jest.fn()},
        disableLifecycleMethods: true,
      });
      await wrapper.instance().handlePostMessage({
        data: {type: "paymentClose", message: {paymentId: "payment-id"}},
        origin: window.location.origin,
      });
      expect(props.navigate).toHaveBeenCalledWith(
        `/${props.orgSlug}/payment/${paymentStatus}`,
      );
    },
  );

  it("should handle postMessage", async () => {
    props = createTestProps();
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: {setLoading: jest.fn()},
      disableLifecycleMethods: true,
    });
    const {handlePostMessage} = wrapper.instance();
    const {setLoading} = wrapper.instance().context;

    await handlePostMessage({
      data: {
        type: "showLoader",
      },
      origin: "http://localhost",
    });
    expect(setLoading).toHaveBeenCalledTimes(1);

    await handlePostMessage({
      data: {
        type: "setHeight",
        message: 800,
      },
      origin: "http://localhost",
    });
    expect(wrapper.instance().state.iframeHeight).toBe(800);
  });

  it("redirects to payment_url when the selected gateway disables iframes", async () => {
    props = createTestProps({
      userData: {...responseData, payment_iframe: false},
      settings: {...props.settings, payment_iframe: true},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    wrapper.instance().redirectToPaymentUrl = jest.fn();
    await tick();
    expect(wrapper.instance().redirectToPaymentUrl).toHaveBeenCalledWith(
      responseData.payment_url,
    );
  });

  it("stores the selected gateway context before an external payment redirect", async () => {
    props = createTestProps({
      userData: {
        ...responseData,
        in_upgrade: true,
        payment_iframe: false,
        payment_requires_internet: false,
      },
      settings: {...props.settings, payment_requires_internet: true},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    wrapper.instance().redirectToPaymentUrl = jest.fn();
    await tick();

    expect(takePaymentReturnContext()).toEqual(
      expect.objectContaining({
        inUpgrade: true,
        paymentRequiresInternet: false,
      }),
    );
  });

  it("preserves gateway context before an iframe token refresh", async () => {
    props = createTestProps({
      userData: {
        ...responseData,
        in_upgrade: true,
        payment_requires_internet: false,
      },
      settings: {...props.settings, payment_requires_internet: true},
    });
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    validateToken.mockImplementation(async () => {
      wrapper.setProps({
        userData: {
          ...responseData,
          in_upgrade: undefined,
          payment_requires_internet: undefined,
        },
      });
      return true;
    });

    await wrapper.instance().componentDidMount();

    expect(takePaymentReturnContext()).toEqual(
      expect.objectContaining({
        inUpgrade: true,
        paymentRequiresInternet: false,
      }),
    );
  });

  it("renders an iframe when the selected gateway enables iframes", async () => {
    const redirectToPaymentUrl = jest
      .spyOn(PaymentProcess.prototype, "redirectToPaymentUrl")
      .mockImplementation();
    props = createTestProps({
      userData: {...responseData, payment_iframe: true},
      settings: {...props.settings, payment_iframe: false},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("iframe")).toHaveLength(1);
    expect(redirectToPaymentUrl).not.toHaveBeenCalled();
  });

  it("redirects a legacy payment when the organization disables iframes", async () => {
    const userData = {...responseData};
    delete userData.payment_iframe;
    props = createTestProps({
      userData,
      settings: {...props.settings, payment_iframe: false},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentProcess {...props} />, {
      context: loadingContextValue,
    });
    wrapper.instance().redirectToPaymentUrl = jest.fn();
    await tick();
    expect(wrapper.instance().redirectToPaymentUrl).toHaveBeenCalledWith(
      responseData.payment_url,
    );
  });
});
