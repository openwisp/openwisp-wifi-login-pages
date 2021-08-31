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
  settings: {subscriptions: true},
  logout: jest.fn(),
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
  const props = createTestProps({userData: responseData, result: "failed"});
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
    props = createTestProps({userData: responseData, result: "failed"});
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
    ).toEqual("/default/status");
    expect(wrapper.find(".payment-status-row-4 .button").length).toEqual(1);
    expect(wrapper.find("Redirect").length).toEqual(0);
  });

  it("should call logout correctly when clicking on logout button", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({userData: responseData, result: "failed"});
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
    });
    expect(wrapper.find("Redirect").length).toEqual(0);
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if user is already verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      result: "failed",
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

  it("should redirect to status if success + toast notification", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      result: "success",
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
      {...props.userData, mustLogout: true, repeatLogin: true},
    ]);
  });

  it("should redirect to status if success but unverified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      result: "success",
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
      result: "success",
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
      result: "failed",
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
      result: "failed",
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
      result: "unexpected",
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
});
