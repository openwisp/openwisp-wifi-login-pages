/* eslint-disable prefer-promise-reject-errors */
import {shallow} from "enzyme";
import React from "react";
import {toast} from "react-toastify";
import PropTypes from "prop-types";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import PaymentStatus from "./payment-status";
import tick from "../../utils/tick";
import validateToken from "../../utils/validate-token";
import loadTranslation from "../../utils/load-translation";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");

const defaultConfig = getConfig("default", true);
const createTestProps = (props) => ({
  orgSlug: "default",
  userData: {},
  setUserData: jest.fn(),
  page: defaultConfig.components.payment_status_page,
  cookies: new Cookies(),
  settings: {subscriptions: true, payment_requires_internet: true},
  logout: jest.fn(),
  authenticate: jest.fn(),
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
};

describe("<PaymentStatus /> rendering with placeholder translation tags", () => {
  const props = createTestProps({
    userData: responseData,
    status: "failed",
    isAuthenticated: true,
  });
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    const wrapper = renderer.render(<PaymentStatus {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("Test <PaymentStatus /> cases", () => {
  let props;
  let wrapper;
  const originalLog = console.log;

  beforeEach(() => {
    props = createTestProps();
    PaymentStatus.contextTypes = {
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

  it("should render failed state", async () => {
    props = createTestProps({userData: responseData, status: "failed"});
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper).toMatchSnapshot();

    expect(wrapper.find(".payment-status-row-1").length).toEqual(1);
    expect(wrapper.find(".payment-status-row-2").length).toEqual(1);
    expect(wrapper.find(".payment-status-row-3").length).toEqual(1);
    expect(wrapper.find(".main-column .button.full").length).toEqual(2);
    expect(
      wrapper.find(".payment-status-row-3 .button").at(0).props().to,
    ).toEqual("/default/payment/draft");
    expect(wrapper.find(".payment-status-row-4 .button").length).toEqual(1);
    expect(wrapper.find("Redirect").length).toEqual(0);
  });

  it("should call logout correctly when clicking on logout button", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({userData: responseData, status: "failed"});
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find(".payment-status-row-4 .button").length).toEqual(1);
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogout: true,
      payment_url: null,
    });
    expect(wrapper.find("Redirect").length).toEqual(0);
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if user is already verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      status: "failed",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("redirect to status + cp logout on success when payment requires internet", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      status: "success",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const comp = wrapper.instance();
    comp.componentDidMount();
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(1);
    expect(comp.props.logout).not.toHaveBeenCalled();
    expect(comp.props.setUserData.mock.calls.pop()).toEqual([
      {
        ...props.userData,
        mustLogin: false,
        mustLogout: true,
        repeatLogin: true,
      },
    ]);
  });

  it("redirect to status + cp login on success when payment does not require internet", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      status: "success",
    });
    props.settings.payment_requires_internet = false;
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const comp = wrapper.instance();
    comp.componentDidMount();
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(1);
    expect(comp.props.logout).not.toHaveBeenCalled();
    expect(comp.props.setUserData.mock.calls.pop()).toEqual([
      {
        ...props.userData,
        mustLogin: true,
        mustLogout: false,
        repeatLogin: false,
      },
    ]);
  });

  it("should redirect to status if success but unverified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      status: "success",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status if success but not using bank_card method", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      status: "success",
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
      },
      userData: {...responseData, method: "mobile_phone"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status if failed but not using bank_card method", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      status: "failed",
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
      },
      userData: {...responseData, method: "mobile_phone"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to login if not authenticated", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      status: "failed",
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
      },
      isAuthenticated: false,
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status if result is not one of the expected values", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      status: "unexpected",
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if draft and not bank_card", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false, method: "mobile_phone"},
      status: "draft",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if draft and verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      status: "draft",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if token is not valid", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      status: "draft",
    });
    validateToken.mockReturnValue(false);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Redirect").length).toEqual(1);
    expect(wrapper.find("Redirect").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
    expect(wrapper.instance().props.setUserData).not.toHaveBeenCalled();
  });

  it("should call logout correctly when clicking on logout button from draft", async () => {
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      status: "draft",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find(".button").length).toEqual(2);
    wrapper.find(".button").at(1).simulate("click", {});
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogout: true,
      payment_url: null,
    });
  });

  it("should render draft correctly", async () => {
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      status: "draft",
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogin: true,
    });
  });
});
