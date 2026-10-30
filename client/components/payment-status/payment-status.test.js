/* eslint-disable prefer-promise-reject-errors */
import {mount, shallow} from "enzyme";
import React from "react";
import {act} from "react-dom/test-utils";
import {MemoryRouter, Route, Routes} from "react-router-dom";
import {Provider} from "react-redux";
import {toast} from "react-toastify";
import PropTypes from "prop-types";
import {Cookies} from "react-cookie";
import ShallowRenderer from "react-test-renderer/shallow";
import {t} from "ttag";
import {loadingContextValue} from "../../utils/loading-context";
import getConfig from "../../utils/get-config";
import PaymentStatus from "./payment-status";
import Loader from "../../utils/loader";
import tick from "../../utils/tick";
import validateToken from "../../utils/validate-token";
import loadTranslation from "../../utils/load-translation";
import cancelUpgradePlan from "../../utils/cancel-upgrade-plan";
import logError from "../../utils/log-error";
import {
  getGateways,
  selectGateway,
  clearPaymentReturnContext,
  takePaymentReturnContext,
  storePaymentReturnContext,
} from "../../utils/payment";
import {clearCaptivePortalFlags} from "../../utils/synced-storage";
import PaymentGateway from "../payment-gateway";
import Status from "../status/status";

jest.mock("axios");
jest.mock("../../utils/get-config");
jest.mock("../../utils/validate-token");
jest.mock("../../utils/load-translation");
jest.mock("../../utils/cancel-upgrade-plan");
jest.mock("../../utils/log-error");
jest.mock("../../utils/payment", () => {
  const actual = jest.requireActual("../../utils/payment");
  return {
    ...actual,
    getGateways: jest.fn(),
    selectGateway: jest.fn(),
  };
});

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
  payment_return_url: "https://wifi.example.com/default/login?n=pay&sid=secret",
  first_name: "",
  last_name: "",
  birth_date: null,
  location: "",
};

describe("<PaymentStatus /> rendering with placeholder translation tags", () => {
  const props = createTestProps({
    userData: responseData,
    params: {status: "failed"},
    isAuthenticated: true,
  });
  it("should render translation placeholder correctly", () => {
    const renderer = new ShallowRenderer();
    renderer.render(<PaymentStatus {...props} />);
    // ShallowRenderer skips componentDidMount; advance isTokenValid past null for markup
    renderer.getMountedInstance().setState({isTokenValid: true});
    const wrapper = renderer.getRenderOutput();
    expect(wrapper).toMatchSnapshot();
  });
});

describe("Test <PaymentStatus /> cases", () => {
  let props;
  let wrapper;
  let clipboardDescriptor;
  let execCommand;
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
    // Preserve browser APIs before individual tests replace them with mocks.
    clipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    execCommand = document.execCommand;
  });

  afterEach(() => {
    clearPaymentReturnContext();
    clearCaptivePortalFlags("default", new Cookies());
    // Restore browser APIs so test-specific mocks do not leak to later tests.
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
    } else {
      delete navigator.clipboard;
    }
    document.execCommand = execCommand;
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    console.log = originalLog;
  });

  it("should render failed state", async () => {
    props = createTestProps({
      userData: responseData,
      params: {status: "failed"},
    });
    storePaymentReturnContext(
      {in_upgrade: true, payment_requires_internet: false},
      {},
    );
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
    expect(wrapper.find("Navigate").length).toEqual(0);
    expect(takePaymentReturnContext()).toBe(null);
  });

  it("selects a gateway only after the user proceeds", async () => {
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
      payment_url: "https://payments.example/select",
    };
    getGateways.mockResolvedValue({
      ...payment,
      gateways: [{key: "offline", label: "Pay at a retailer"}],
    });
    props = createTestProps({
      userData: {...responseData, ...payment, is_verified: false},
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const selector = wrapper.find(PaymentGateway);
    expect(selector).toHaveLength(1);
    expect(selectGateway).not.toHaveBeenCalled();
    selector.prop("onSelect")("offline");
    expect(selectGateway).not.toHaveBeenCalled();
    selectGateway.mockResolvedValue({
      ...payment,
      payment_gateway: "offline",
      payment_requires_internet: false,
      payment_url: "https://payments.example/process",
    });
    await selector.prop("onProceed")();
    expect(selectGateway).toHaveBeenCalledWith(
      "default",
      "payment-id",
      "offline",
      responseData.auth_token || responseData.key,
      props.language,
    );
    expect(props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      payment_gateway: "offline",
      payment_requires_internet: false,
      payment_url: "https://payments.example/process",
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/payment/process");
    expect(props.authenticate).not.toHaveBeenCalled();
  });

  it("ignores a gateway response that arrives after cancellation", async () => {
    let resolveSelection;
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
      payment_url: "https://payments.example/select",
    };
    getGateways.mockResolvedValue({
      gateways: [{key: "online", label: "Card"}],
    });
    selectGateway.mockReturnValue(
      new Promise((resolve) => {
        resolveSelection = resolve;
      }),
    );
    cancelUpgradePlan.mockResolvedValue({});
    props = createTestProps({
      userData: {
        ...responseData,
        ...payment,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
      },
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(PaymentGateway).prop("onSelect")("online");
    const selection = wrapper.find(PaymentGateway).prop("onProceed")();
    await wrapper.find(PaymentGateway).prop("onCancel")();
    resolveSelection({
      ...payment,
      payment_gateway: "online",
      payment_requires_internet: true,
      payment_url: "https://payments.example/process",
    });
    await selection;
    expect(props.setUserData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        in_upgrade: false,
        payment_url: null,
      }),
    );
    expect(props.navigate).toHaveBeenLastCalledWith("/default/status");
    expect(props.navigate).not.toHaveBeenCalledWith("/default/payment/draft");
  });

  it("allows retrying gateway selection after cancellation fails", async () => {
    let resolveSelection;
    let rejectCancellation;
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
      payment_url: "https://payments.example/select",
    };
    getGateways.mockResolvedValue({
      gateways: [{key: "online", label: "Card"}],
    });
    selectGateway.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSelection = resolve;
      }),
    );
    cancelUpgradePlan.mockReturnValue(
      new Promise((resolve, reject) => {
        rejectCancellation = reject;
      }),
    );
    props = createTestProps({
      userData: {
        ...responseData,
        ...payment,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
      },
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(PaymentGateway).prop("onSelect")("online");
    const selection = wrapper.find(PaymentGateway).prop("onProceed")();
    const cancellation = wrapper.find(PaymentGateway).prop("onCancel")();
    expect(wrapper.find(PaymentGateway).prop("submitting")).toBe(true);
    rejectCancellation(new Error("Cancellation failed"));
    await cancellation;
    expect(wrapper.find(PaymentGateway).prop("submitting")).toBe(false);
    expect(props.navigate).not.toHaveBeenCalled();
    resolveSelection({...payment, payment_gateway: "online"});
    await selection;
    expect(props.setUserData).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
    selectGateway.mockResolvedValue({...payment, payment_gateway: "online"});
    await wrapper.find(PaymentGateway).prop("onProceed")();
    expect(selectGateway).toHaveBeenCalledTimes(2);
    expect(props.setUserData).toHaveBeenCalledTimes(1);
  });

  it("ignores a gateway response after unmounting", async () => {
    let resolveSelection;
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
      payment_url: "https://payments.example/select",
    };
    getGateways.mockResolvedValue({
      gateways: [{key: "online", label: "Card"}],
    });
    selectGateway.mockReturnValue(
      new Promise((resolve) => {
        resolveSelection = resolve;
      }),
    );
    props = createTestProps({
      userData: {...responseData, ...payment},
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(PaymentGateway).prop("onSelect")("online");
    const selection = wrapper.find(PaymentGateway).prop("onProceed")();
    wrapper.unmount();
    resolveSelection({
      ...payment,
      payment_gateway: "online",
      payment_requires_internet: true,
      payment_url: "https://payments.example/process",
    });
    await selection;
    expect(props.setUserData).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("does not prepare payment status after unmounting during token validation", async () => {
    let resolveValidation;
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      params: {status: "success"},
    });
    validateToken.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveValidation = resolve;
        }),
    );
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const prepareStatus = jest.spyOn(wrapper.instance(), "prepareStatus");
    const mounting = wrapper.instance().componentDidMount();
    wrapper.unmount();
    resolveValidation(true);
    await mounting;
    expect(prepareStatus).not.toHaveBeenCalled();
    expect(props.setUserData).not.toHaveBeenCalled();
  });

  it("re-enables gateway selection when the response still requires it", async () => {
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
      payment_url: "https://payments.example/select",
    };
    getGateways.mockResolvedValue({
      ...payment,
      gateways: [{key: "offline", label: "Pay at a retailer"}],
    });
    selectGateway.mockResolvedValue(payment);
    props = createTestProps({
      userData: {...responseData, ...payment},
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(PaymentGateway).prop("onSelect")("offline");
    await wrapper.find(PaymentGateway).prop("onProceed")();
    const selector = wrapper.find(PaymentGateway);
    expect(selector.prop("submitting")).toBe(false);
    expect(selector.prop("error")).toBe(false);
    await selector.prop("onProceed")();
    expect(selectGateway).toHaveBeenCalledTimes(2);
  });

  it("prepares the draft page after a gateway is selected", async () => {
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
      payment_url: "https://payments.example/select",
    };
    getGateways.mockResolvedValue({
      ...payment,
      gateways: [{key: "online", label: "Card"}],
    });
    props = createTestProps({
      userData: {...responseData, ...payment},
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const selectedUserData = {
      ...responseData,
      ...payment,
      payment_gateway: "online",
      payment_requires_internet: true,
      payment_url: "https://payments.example/online",
    };
    wrapper.setProps({params: {status: "draft"}, userData: selectedUserData});
    await tick();
    expect(props.setUserData).toHaveBeenCalledTimes(1);
    expect(props.setUserData).toHaveBeenCalledWith({
      ...selectedUserData,
      mustLogin: true,
    });
    expect(validateToken).toHaveBeenCalledTimes(1);
    expect(getGateways).toHaveBeenCalledTimes(1);
    expect(selectGateway).not.toHaveBeenCalled();
  });

  it("skips gateway selection when the payment is already selected", async () => {
    props = createTestProps({
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_gateway: "offline",
        payment_requires_internet: false,
        payment_url: "https://payments.example/process",
      },
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(getGateways).not.toHaveBeenCalled();
    expect(wrapper.find(PaymentGateway)).toHaveLength(0);
    expect(wrapper.find("Navigate").prop("to")).toBe(
      "/default/payment/process",
    );
  });

  it("lets an upgrading user abandon the upgrade from gateway selection", async () => {
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
    };
    getGateways.mockResolvedValue({
      gateways: [{key: "offline", label: "Pay at a retailer"}],
    });
    cancelUpgradePlan.mockResolvedValue({});
    props = createTestProps({
      userData: {
        ...responseData,
        ...payment,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
      },
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const selector = wrapper.find(PaymentGateway);
    expect(selector.prop("cancelLabel")).toEqual("Cancel");
    await selector.prop("onCancel")();
    expect(cancelUpgradePlan).toHaveBeenCalledWith(
      props.orgSlug,
      props.userData.auth_token || props.userData.key,
      props.language,
    );
    expect(props.setUserData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        in_upgrade: false,
        proceedToPayment: false,
        payment_url: null,
        payment_return_url: null,
        mustLogin: undefined,
        mustLogout: true,
        captivePortalLogoutOnly: true,
      }),
    );
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
    expect(props.logout).not.toHaveBeenCalled();
  });

  it("lets a new user give up from gateway selection", async () => {
    const payment = {
      payment_id: "payment-id",
      payment_gateway: null,
      payment_requires_internet: null,
    };
    getGateways.mockResolvedValue({
      gateways: [{key: "offline", label: "Pay at a retailer"}],
    });
    props = createTestProps({
      userData: {...responseData, ...payment, is_verified: false},
      params: {status: "gateway"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const selector = wrapper.find(PaymentGateway);
    expect(selector.prop("cancelLabel")).toEqual(
      "Cancel operation and log out",
    );
    selector.prop("onCancel")();
    expect(cancelUpgradePlan).not.toHaveBeenCalled();
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({mustLogout: true}),
    );
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it("shows a retry action when loading gateways fails", async () => {
    props = createTestProps({
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_gateway: null,
        payment_requires_internet: null,
        payment_url: "https://payments.example/select",
      },
      params: {status: "gateway"},
    });
    getGateways.mockRejectedValue(new Error("Network error"));
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const selector = wrapper.find(PaymentGateway);
    expect(selector.prop("error")).toBe(true);
    expect(props.authenticate).not.toHaveBeenCalled();
    getGateways.mockResolvedValue({gateways: []});
    await selector.prop("onRetry")();
    expect(getGateways).toHaveBeenCalledTimes(2);
    expect(wrapper.find(PaymentGateway).prop("error")).toBe(false);
  });

  it("redirects unauthenticated users away from gateway selection", async () => {
    props = createTestProps({
      userData: {},
      params: {status: "gateway"},
      isAuthenticated: false,
    });
    validateToken.mockReturnValue(false);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find(Loader)).toHaveLength(0);
    expect(wrapper.find("Navigate").prop("to")).toBe("/default/status");
    await tick();
    expect(getGateways).not.toHaveBeenCalled();
    expect(wrapper.find(PaymentGateway)).toHaveLength(0);
  });

  it.each([
    ["no pending payment", {}],
    [
      "not bank_card",
      {
        payment_id: "payment-id",
        payment_requires_internet: null,
        method: "mobile_phone",
      },
    ],
    [
      "verified and not upgrading",
      {
        payment_id: "payment-id",
        payment_requires_internet: null,
        is_verified: true,
      },
    ],
  ])("redirects to status from gateway selection: %s", async (_, overrides) => {
    props = createTestProps({
      userData: {...responseData, ...overrides},
      params: {status: "gateway"},
      isAuthenticated: true,
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").prop("to")).toBe("/default/status");
    expect(getGateways).not.toHaveBeenCalled();
  });

  it("should show a loader instead of the wrong failed variant on cold load", () => {
    // Cold reload: in_upgrade unknown until validateToken resolves, show loader
    props = createTestProps({
      userData: {},
      params: {status: "failed"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find(Loader)).toHaveLength(1);
    expect(wrapper.find("Navigate").length).toEqual(0);
    expect(wrapper.find(".payment-status-row-1").length).toEqual(0);
  });

  it("should show a loader instead of the wrong abandon button on a cold draft load", () => {
    // Cold reload: in_upgrade unknown until validateToken resolves, so
    // isDraftUpgrade cannot be decided yet. Rendering renderDraft early would
    // briefly wire the abandon button to logout instead of backToStatus.
    props = createTestProps({
      userData: {},
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find(Loader)).toHaveLength(1);
    expect(wrapper.find("Navigate").length).toEqual(0);
    expect(wrapper.find(".main-column.single").length).toEqual(0);
    expect(wrapper.find("button.button.full").length).toEqual(0);
  });

  it("should call logout correctly when clicking on logout button", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: responseData,
      params: {status: "failed"},
    });
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
    expect(wrapper.find("Navigate").length).toEqual(0);
    expect(spyToast.mock.calls.length).toBe(0);
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it("should redirect to status page if user is already verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      params: {status: "failed"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should cancel an upgrade when payment is cancelled", async () => {
    props = createTestProps({
      userData: {...responseData, in_upgrade: true},
      params: {status: "cancelled"},
    });
    cancelUpgradePlan.mockResolvedValue({in_upgrade: false, payment_url: null});
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(cancelUpgradePlan).toHaveBeenCalledWith(
      props.orgSlug,
      responseData.key,
      undefined,
    );
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it.each([
    ["token validation fails", true, false],
    ["the user is unauthenticated", false, false],
  ])(
    "redirects a cancelled payment when %s",
    async (_, isAuthenticated, valid) => {
      props = createTestProps({
        userData: {},
        params: {status: "cancelled"},
        isAuthenticated,
      });
      validateToken.mockResolvedValue(valid);
      wrapper = shallow(<PaymentStatus {...props} />, {
        context: loadingContextValue,
      });
      await tick();
      expect(wrapper.find("Navigate").prop("to")).toBe("/default/status");
      expect(cancelUpgradePlan).not.toHaveBeenCalled();
    },
  );

  it("keeps the cancellation loader while a valid cancellation is pending", async () => {
    let resolveCancellation;
    props = createTestProps({
      userData: {...responseData, in_upgrade: true},
      params: {status: "cancelled"},
      isAuthenticated: true,
    });
    validateToken.mockResolvedValue(true);
    cancelUpgradePlan.mockReturnValue(
      new Promise((resolve) => {
        resolveCancellation = resolve;
      }),
    );
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find(Loader)).toHaveLength(1);
    expect(props.navigate).not.toHaveBeenCalled();
    resolveCancellation({});
    await tick();
  });

  it("should clear a cancelled payment before returning to status", async () => {
    props = createTestProps({
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_gateway: "offline",
      },
      params: {status: "cancelled"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      payment_id: null,
      payment_gateway: null,
      payment_url: null,
      payment_return_url: null,
      proceedToPayment: false,
    });
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it("redirect to status + cp logout on success when payment requires internet", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      params: {status: "success"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const comp = wrapper.instance();
    comp.componentDidMount();
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
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

  it.each([
    [true, {mustLogin: "false", mustLogout: "true", repeatLogin: "true"}],
    [false, {mustLogin: "true", mustLogout: "false", repeatLogin: "false"}],
  ])(
    "persists the captive portal flags on success with sync auth (payment_requires_internet: %s)",
    async (paymentRequiresInternet, expected) => {
      props = createTestProps({
        userData: {...responseData, is_verified: true},
        params: {status: "success"},
        captivePortalSyncAuth: true,
        cookies: new Cookies(),
      });
      props.settings.payment_requires_internet = paymentRequiresInternet;
      validateToken.mockReturnValue(true);
      wrapper = shallow(<PaymentStatus {...props} />, {
        context: loadingContextValue,
        disableLifecycleMethods: true,
      });
      wrapper.instance().componentDidMount();
      await tick();
      Object.entries(expected).forEach(([flag, value]) => {
        expect(String(props.cookies.get(`default_${flag}`))).toBe(value);
        expect(localStorage.getItem(`default_${flag}`)).toBe(value);
        props.cookies.remove(`default_${flag}`, {path: "/"});
        localStorage.removeItem(`default_${flag}`);
      });
    },
  );

  it("redirect to status + cp login on success when payment does not require internet", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      params: {status: "success"},
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
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
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

  it("does not force logout/relogin on success when captive portal supports CoA", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      params: {status: "success"},
    });
    props.settings.captive_portal_supports_coa = true;
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const comp = wrapper.instance();
    comp.componentDidMount();
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(1);
    expect(comp.props.logout).not.toHaveBeenCalled();
    expect(comp.props.setUserData).not.toHaveBeenCalled();
  });

  it.each([
    // Internet-required payment without CoA must log out then log in again.
    [
      "an internet-required payment without CoA",
      true,
      false,
      {mustLogin: false, mustLogout: true, repeatLogin: true},
    ],
    // An offline payment must establish a portal session after it succeeds.
    [
      "a payment that does not require Internet without CoA",
      false,
      false,
      {mustLogin: true, mustLogout: false, repeatLogin: false},
    ],
    // CoA restores portal access without any login or logout action.
    ["an internet-required payment with CoA", true, true, null],
    // Without a prior portal session, CoA cannot authorize the user.
    [
      "a payment that does not require Internet with CoA",
      false,
      true,
      {mustLogin: true, mustLogout: false, repeatLogin: false},
    ],
  ])(
    "sets payment success flags for %s",
    async (
      _,
      paymentRequiresInternet,
      captivePortalSupportsCoa,
      expectedFlags,
    ) => {
      props = createTestProps({
        userData: {...responseData, is_verified: true},
        params: {status: "success"},
      });
      props.settings.payment_requires_internet = paymentRequiresInternet;
      props.settings.captive_portal_supports_coa = captivePortalSupportsCoa;
      validateToken.mockReturnValue(true);
      wrapper = shallow(<PaymentStatus {...props} />, {
        context: loadingContextValue,
        disableLifecycleMethods: true,
      });
      await wrapper.instance().componentDidMount();
      expect(props.setUserData.mock.calls).toEqual(
        expectedFlags ? [[{...props.userData, ...expectedFlags}]] : [],
      );
    },
  );

  it("logs an external offline upgrade into the captive portal after payment with CoA", async () => {
    const cookies = new Cookies();
    const expectedFlags = {
      mustLogin: true,
      mustLogout: false,
      repeatLogin: false,
    };
    props = createTestProps({
      userData: {},
      params: {status: "success"},
      captivePortalSyncAuth: true,
      cookies,
    });
    props.settings.payment_requires_internet = false;
    props.settings.captive_portal_supports_coa = true;
    storePaymentReturnContext(
      {
        ...responseData,
        in_upgrade: true,
        payment_requires_internet: false,
      },
      props.settings,
    );
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const validatedUser = {
      ...responseData,
      method: "mobile_phone",
      is_verified: true,
      in_upgrade: undefined,
    };
    validateToken.mockImplementation(async () => {
      wrapper.setProps({userData: validatedUser});
      return true;
    });
    await wrapper.instance().componentDidMount();
    expect(props.setUserData).toHaveBeenCalledWith({
      ...validatedUser,
      ...expectedFlags,
    });
    ["mustLogin", "mustLogout", "repeatLogin"].forEach((flag) => {
      expect(String(cookies.get(`default_${flag}`))).toBe(
        String(expectedFlags[flag]),
      );
      expect(localStorage.getItem(`default_${flag}`)).toBe(
        String(expectedFlags[flag]),
      );
    });
  });

  it("submits the captive portal login after an offline iframe upgrade", async () => {
    const cookies = new Cookies();
    const settings = {
      ...defaultConfig.settings,
      payment_iframe: true,
      payment_requires_internet: false,
      captive_portal_supports_coa: true,
    };
    const validatedUser = {
      ...responseData,
      method: "mobile_phone",
      is_verified: true,
      in_upgrade: undefined,
    };
    storePaymentReturnContext(
      {...validatedUser, in_upgrade: true, payment_requires_internet: false},
      settings,
    );
    let resolvePaymentValidation;
    validateToken
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePaymentValidation = resolve;
          }),
      )
      .mockResolvedValue(true);
    const submit = jest
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});
    const store = {
      subscribe: () => {},
      dispatch: () => {},
      getState: () => ({
        organization: {
          configuration: {
            ...defaultConfig,
            isAuthenticated: true,
            userData: validatedUser,
          },
        },
        language: "en",
      }),
    };
    const setUserData = jest.fn((data) => Object.assign(validatedUser, data));
    const paymentProps = createTestProps({
      cookies,
      params: {status: "success"},
      settings,
      userData: validatedUser,
      setUserData,
      isAuthenticated: true,
      captivePortalSyncAuth: true,
    });
    const statusProps = {
      ...paymentProps,
      orgName: "default",
      statusPage: defaultConfig.components.status_page,
      captivePortalLoginForm:
        defaultConfig.components.captive_portal_login_form,
      captivePortalLogoutForm:
        defaultConfig.components.captive_portal_logout_form,
      location: {search: ""},
      internetMode: false,
      planExhausted: false,
      setTitle: jest.fn(),
      setInternetMode: jest.fn(),
      setPlanExhausted: jest.fn(),
      defaultLanguage: defaultConfig.default_language,
    };
    wrapper = mount(
      <Provider store={store}>
        <MemoryRouter
          initialEntries={["/default/payment/success"]}
          future={{v7_startTransition: true, v7_relativeSplatPath: true}}
        >
          <Routes>
            <Route
              path="/default/payment/success"
              element={<PaymentStatus {...paymentProps} />}
            />
            <Route
              path="/default/status"
              element={<Status {...statusProps} />}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    await tick();
    wrapper.update();
    expect(wrapper.find("Router").prop("location").pathname).toBe(
      "/default/payment/success",
    );
    await act(async () => {
      resolvePaymentValidation(true);
      await tick();
    });
    wrapper.update();
    expect(wrapper.find("Router").prop("location").pathname).toBe(
      "/default/status",
    );
    expect(submit).toHaveBeenCalledTimes(1);
    ["mustLogin", "mustLogout", "repeatLogin"].forEach((flag) => {
      cookies.remove(`default_${flag}`, {path: "/"});
      localStorage.removeItem(`default_${flag}`);
    });
    wrapper.unmount();
  });

  it.each([
    ["keeps CoA handling", true, null],
    [
      "restarts the portal session without CoA",
      false,
      {mustLogin: false, mustLogout: true, repeatLogin: true},
    ],
  ])(
    "%s for an external online upgrade",
    async (_, captivePortalSupportsCoa, expectedFlags) => {
      props = createTestProps({
        userData: {},
        params: {status: "success"},
      });
      props.settings.payment_requires_internet = false;
      props.settings.captive_portal_supports_coa = captivePortalSupportsCoa;
      storePaymentReturnContext(
        {
          ...responseData,
          in_upgrade: true,
          payment_requires_internet: true,
        },
        props.settings,
      );
      wrapper = shallow(<PaymentStatus {...props} />, {
        context: loadingContextValue,
        disableLifecycleMethods: true,
      });
      const validatedUser = {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: undefined,
      };
      validateToken.mockImplementation(async () => {
        wrapper.setProps({userData: validatedUser});
        return true;
      });
      await wrapper.instance().componentDidMount();
      expect(props.setUserData.mock.calls).toEqual(
        expectedFlags ? [[{...validatedUser, ...expectedFlags}]] : [],
      );
    },
  );

  it("should set proceedToPayment in userData and not persist it without sync auth", async () => {
    // If the payment requires internet, proceedToPayment should
    // be set to true in userData
    validateToken.mockReturnValue(true);
    // Test payment_requires_internet is set to false
    let mockCookiesSet = jest.fn();
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "draft"},
      cookies: {set: mockCookiesSet, get: jest.fn(), remove: jest.fn()},
    });
    props.settings.payment_requires_internet = false;
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.instance().props.setUserData.mockClear();
    let payProcButton = wrapper
      .find("Link.button.full")
      .findWhere((node) => node.text() === t`PAY_PROC_BTN`)
      .first();
    payProcButton.simulate("click");
    expect(wrapper.instance().props.setUserData).not.toHaveBeenCalled();
    expect(mockCookiesSet).not.toHaveBeenCalled();
    // Test payment_requires_internet is set to true, without sync auth
    mockCookiesSet = jest.fn();
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "draft"},
      cookies: {set: mockCookiesSet, get: jest.fn(), remove: jest.fn()},
    });
    props.settings.payment_requires_internet = true;
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    payProcButton = wrapper
      .find("Link.button.full")
      .findWhere((node) => node.text() === t`PAY_PROC_BTN`)
      .first();
    payProcButton.simulate("click");
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      is_verified: false,
      mustLogin: true,
      proceedToPayment: true,
    });
    // Async auth never reloads the page, so there is nothing to survive
    // and the flag doesn't need to be persisted outside Redux.
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });

  it("should persist proceedToPayment cookie for sync auth", async () => {
    validateToken.mockReturnValue(true);
    const mockCookiesSet = jest.fn();
    const mockCookiesRemove = jest.fn();
    const mockCookiesGet = jest.fn();
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "draft"},
      captivePortalSyncAuth: true,
      cookies: {
        set: mockCookiesSet,
        remove: mockCookiesRemove,
        get: mockCookiesGet,
      },
    });
    props.settings.payment_requires_internet = true;
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const payProcButton = wrapper
      .find("Link.button.full")
      .findWhere((node) => node.text() === t`PAY_PROC_BTN`)
      .first();
    payProcButton.simulate("click");
    // Verify the cookie was set
    expect(mockCookiesSet).toHaveBeenCalledWith(
      "default_proceedToPayment",
      true,
      {path: "/", maxAge: 60},
    );
    // Verify userData was updated with proceedToPayment
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({proceedToPayment: true}),
    );
  });

  it("uses the selected gateway requirement instead of the organization fallback", async () => {
    const mockCookiesSet = jest.fn();
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_requires_internet: false,
      },
      params: {status: "draft"},
      captivePortalSyncAuth: true,
      cookies: {set: mockCookiesSet, get: jest.fn(), remove: jest.fn()},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const payProcButton = wrapper
      .find("Link.button.full")
      .findWhere((node) => node.text() === t`PAY_PROC_BTN`)
      .first();
    expect(payProcButton.prop("to")).toBe("/default/payment/process");
    props.setUserData.mockClear();
    payProcButton.simulate("click");
    expect(props.setUserData).not.toHaveBeenCalled();
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });

  it("should redirect to status if success but unverified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "success"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status if success but not using bank_card method", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "success"},
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
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status if failed but not using bank_card method", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "failed"},
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
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should not force captive portal login when retrying and payment does not require internet", async () => {
    const mockCookiesSet = jest.fn();
    props = createTestProps({
      params: {status: "failed"},
      cookies: {set: mockCookiesSet, get: jest.fn(), remove: jest.fn()},
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
        payment_requires_internet: false,
      },
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(0);
    expect(wrapper.find(".payment-status-row-1").length).toEqual(1);
    expect(
      wrapper.find(".payment-status-row-3 .button").at(0).props().to,
    ).toEqual("/default/payment/process");
    wrapper.find(".payment-status-row-3 .button").at(0).simulate("click");
    expect(mockCookiesSet).not.toHaveBeenCalled();
    expect(wrapper.instance().props.setUserData).not.toHaveBeenCalled();
    // No captive portal login needed when internet is not required, so the
    // retry is a plain navigation and paymentProceedHandler must not run.
    expect(props.authenticate).not.toHaveBeenCalled();
  });

  it("should retry a failed payment on the gateway page when no gateway is selected", async () => {
    props = createTestProps({
      params: {status: "failed"},
      userData: {
        ...responseData,
        payment_id: "payment-id",
        payment_url: "https://payment.example.com/pay/1",
        payment_requires_internet: null,
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(
      wrapper.find(".payment-status-row-3 .button").at(0).props().to,
    ).toEqual("/default/payment/gateway");
  });

  it("should retry a failed upgrade on the gateway page when no gateway is selected", async () => {
    props = createTestProps({
      params: {status: "failed"},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_id: "payment-id",
        payment_url: "https://payment.example.com/pay/1",
        payment_requires_internet: null,
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const retryButton = wrapper.find(".payment-status-row-3 .button").at(0);
    expect(retryButton.props().to).toEqual("/default/payment/gateway");
    retryButton.simulate("click");
    expect(props.authenticate).not.toHaveBeenCalled();
  });

  it("should log into the captive portal when retrying a failed upgrade", async () => {
    const mockCookiesSet = jest.fn();
    props = createTestProps({
      params: {status: "failed"},
      captivePortalSyncAuth: true,
      cookies: {set: mockCookiesSet, get: jest.fn(), remove: jest.fn()},
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
        payment_requires_internet: true,
      },
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(
      wrapper.find(".payment-status-row-3 .button").at(0).props().to,
    ).toEqual("/default/status");
    wrapper.find(".payment-status-row-3 .button").at(0).simulate("click");
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({mustLogin: true, proceedToPayment: true}),
    );
    expect(mockCookiesSet).toHaveBeenCalledWith("default_mustLogin", true, {
      path: "/",
      maxAge: 60,
    });
    expect(mockCookiesSet).toHaveBeenCalledWith(
      "default_proceedToPayment",
      true,
      {path: "/", maxAge: 60},
    );
    expect(props.authenticate).toHaveBeenCalledWith(true);
  });

  it("should clear in_upgrade even when the cancel response omits it", async () => {
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockReturnValue(true);
    // The cancel API response does not echo back in_upgrade.
    cancelUpgradePlan.mockResolvedValue({});
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    await tick();
    expect(props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      in_upgrade: false,
      proceedToPayment: false,
      payment_url: null,
      payment_return_url: null,
      mustLogin: undefined,
      mustLogout: true,
      captivePortalLogoutOnly: true,
    });
  });

  it("should clear the persisted proceedToPayment flag when abandoning an upgrade", async () => {
    const mockCookiesRemove = jest.fn();
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
        remove: mockCookiesRemove,
      },
    });
    localStorage.setItem("default_proceedToPayment", "true");
    storePaymentReturnContext(props.userData, props.settings);
    validateToken.mockReturnValue(true);
    cancelUpgradePlan.mockResolvedValue({
      in_upgrade: false,
      payment_url: null,
    });
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    await tick();
    expect(cancelUpgradePlan).toHaveBeenCalledWith(
      props.orgSlug,
      props.userData.auth_token || props.userData.key,
      props.language,
    );
    expect(props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      in_upgrade: false,
      proceedToPayment: false,
      payment_url: null,
      payment_return_url: null,
      mustLogin: undefined,
      mustLogout: true,
      captivePortalLogoutOnly: true,
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
    expect(props.logout).not.toHaveBeenCalled();
    // Stale flag must be cleared, otherwise a later status reload could
    // wrongly force the user back into the payment flow.
    expect(mockCookiesRemove).toHaveBeenCalledWith("default_proceedToPayment", {
      path: "/",
    });
    expect(localStorage.getItem("default_proceedToPayment")).toBeNull();
    expect(takePaymentReturnContext()).toBe(null);
  });

  it("should finish upgrade cancellation cleanup after unmounting", async () => {
    let resolveCancellation;
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    cancelUpgradePlan.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCancellation = resolve;
        }),
    );
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
      disableLifecycleMethods: true,
    });
    const cancellation = wrapper.instance().backToStatus();
    wrapper.unmount();
    resolveCancellation({});
    await cancellation;
    expect(props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      in_upgrade: false,
      proceedToPayment: false,
      payment_url: null,
      payment_return_url: null,
      mustLogin: undefined,
      mustLogout: true,
      captivePortalLogoutOnly: true,
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("should silently ignore a 404 when cancelling an non-existent upgrade", async () => {
    const spyToastError = jest.spyOn(toast, "error");
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockReturnValue(true);
    cancelUpgradePlan.mockRejectedValue({response: {status: 404}});
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    await tick();
    // The order does not existing on OpenWISP
    expect(spyToastError).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(props.setUserData).toHaveBeenCalledWith({
      ...props.userData,
      in_upgrade: false,
      proceedToPayment: false,
      payment_url: null,
      payment_return_url: null,
      mustLogin: undefined,
      mustLogout: true,
      captivePortalLogoutOnly: true,
    });
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("should surface a 404 that carries response_code NOT_FOUND", async () => {
    // Our own server also answers 404 for an unknown organization slug, in
    // that shape. That must not be swallowed as "nothing to cancel".
    const spyToastError = jest.spyOn(toast, "error");
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockReturnValue(true);
    cancelUpgradePlan.mockRejectedValue({
      response: {status: 404, data: {response_code: "NOT_FOUND"}},
    });
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    await tick();
    expect(spyToastError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      {response: {status: 404, data: {response_code: "NOT_FOUND"}}},
      "Error while cancelling plan upgrade",
    );
    expect(props.setUserData).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("preserves a pending upgrade and allows cancellation to be retried after an error", async () => {
    const spyToastError = jest.spyOn(toast, "error");
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockReturnValue(true);
    cancelUpgradePlan.mockRejectedValueOnce({response: {status: 500}});
    cancelUpgradePlan.mockResolvedValueOnce({});
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    localStorage.setItem("default_proceedToPayment", "true");
    storePaymentReturnContext(props.userData, props.settings);
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    await tick();
    expect(spyToastError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      {response: {status: 500}},
      "Error while cancelling plan upgrade",
    );
    expect(props.setUserData).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem("default_proceedToPayment")).toBe("true");
    expect(takePaymentReturnContext()).toEqual({
      inUpgrade: true,
      paymentRequiresInternet: false,
    });
    wrapper.find(".payment-status-row-4 .button").simulate("click", {});
    await tick();
    expect(cancelUpgradePlan).toHaveBeenCalledTimes(2);
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({in_upgrade: false, payment_url: null}),
    );
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("offers cancellation retry after a cancelled gateway return fails", async () => {
    props = createTestProps({
      params: {status: "cancelled"},
      isAuthenticated: true,
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
    });
    validateToken.mockResolvedValue(true);
    cancelUpgradePlan.mockRejectedValueOnce(new Error("Network error"));
    cancelUpgradePlan.mockResolvedValueOnce({});
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(props.setUserData).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
    expect(wrapper.find(Loader)).toHaveLength(0);
    expect(wrapper.find("button.button.full")).toHaveLength(1);
    wrapper.find("button.button.full").simulate("click");
    await tick();
    expect(cancelUpgradePlan).toHaveBeenCalledTimes(2);
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("should hide the continue button if the payment url is not available", async () => {
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: null,
      },
    });
    validateToken.mockReturnValue(true);
    cancelUpgradePlan.mockResolvedValue({
      in_upgrade: false,
      payment_url: null,
    });
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(0);
    expect(wrapper.find(".payment-status-row-3").length).toEqual(0);
    expect(wrapper.find(".payment-status-row-4 .button").length).toEqual(1);
  });

  it("should redirect to status if verified and not upgrading", async () => {
    props = createTestProps({
      params: {status: "failed"},
      settings: {subscriptions: true, mobile_phone_verification: true},
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
      },
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
  });

  it("should redirect to login if not authenticated", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "failed"},
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
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status if result is not one of the expected values", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      params: {status: "unexpected"},
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
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if draft and not bank_card", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false, method: "mobile_phone"},
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if draft and verified", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: true},
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
  });

  it("should redirect to status page if token is not valid", async () => {
    const spyToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(false);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(1);
    expect(wrapper.find("Navigate").props().to).toEqual("/default/status");
    expect(spyToast.mock.calls.length).toBe(0);
    expect(wrapper.instance().props.setUserData).not.toHaveBeenCalled();
  });

  it("should call logout correctly when clicking on logout button from draft", async () => {
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("button.button.full")).toHaveLength(1);
    wrapper.find("button.button.full").simulate("click", {});
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith({
      ...responseData,
      mustLogout: true,
      payment_url: null,
    });
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
  });

  it("should render draft correctly", async () => {
    props = createTestProps({
      userData: {...responseData, is_verified: false},
      params: {status: "draft"},
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

  it("should show a copyable payment link on a paid signup draft", async () => {
    const paymentUrl = "https://payment.example.com/pay/1?order=123";
    const paymentReturnUrl =
      "https://wifi.example.com/default/login?n=pay&sid=secret";
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_url: paymentUrl,
        payment_return_url: paymentReturnUrl,
      },
      params: {status: "draft"},
    });
    expect(props.page).toEqual({timeout: 10, max_attempts: 3});
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const input = wrapper.find("input#payment-link");
    const copyButton = wrapper.find("button.payment-link-copy");
    expect(input).toHaveLength(1);
    expect(input.prop("value")).toEqual(paymentReturnUrl);
    expect(input.prop("readOnly")).toEqual(true);
    expect(input.prop("title")).toEqual(t`PAY_LINK_COPY_HINT`);
    expect(input.prop("disabled")).toBeUndefined();
    expect(copyButton.prop("type")).toEqual("button");
    expect(copyButton.hasClass("partial")).toEqual(true);
    expect(copyButton.text()).toEqual(t`PAY_LINK_COPY_BTN`);
    expect(
      copyButton.find(".payment-link-copy-icon").prop("aria-hidden"),
    ).toEqual("true");
    expect(input.prop("aria-describedby")).toEqual("payment-link-help");
    expect(copyButton.prop("aria-label")).toEqual(t`PAY_LINK_COPY_BTN`);
    expect(copyButton.find(".payment-link-copy-label").text()).toEqual(
      t`PAY_LINK_COPY_BTN`,
    );
    expect(
      copyButton
        .find(".payment-link-copy-icon")
        .hasClass("payment-link-copy-label"),
    ).toEqual(false);
    expect(wrapper.find(".payment-instructions")).toHaveLength(2);
    expect(
      wrapper
        .find(".payment-instructions")
        .at(0)
        .prop("dangerouslySetInnerHTML"),
    ).toEqual({
      __html:
        "<p>You have <strong>10 minutes</strong> to complete your payment. Make sure you're ready before proceeding.</p><p>Copy the payment link below. If this window closes, you can paste the link into your browser to continue.</p>",
    });
    expect(
      wrapper
        .find(".payment-instructions")
        .at(1)
        .prop("dangerouslySetInnerHTML"),
    ).toEqual({
      __html:
        "<p>If you run out of time, log in again to retry. You have up to <strong>3 attempts</strong>.</p>",
    });
    expect(input.prop("aria-describedby")).toEqual("payment-link-help");
    expect(wrapper.find("#payment-link-help").exists()).toEqual(true);
    const content = wrapper.find(".main-column > .inner").children();
    expect(content.at(1).hasClass("payment-instructions")).toEqual(true);
    expect(content.at(2).hasClass("payment-link")).toEqual(true);
    expect(content.at(3).hasClass("payment-instructions")).toEqual(true);
  });

  it("should hide and refuse to copy a missing payment return link", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {writeText},
    });
    const successToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_url: "https://payment.example.com/pay/1?order=123",
        payment_return_url: null,
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("#payment-link-help")).toHaveLength(0);
    expect(wrapper.find("input#payment-link")).toHaveLength(0);
    expect(wrapper.find("button.payment-link-copy")).toHaveLength(0);
    expect(wrapper.find(".payment-instructions")).toHaveLength(1);
    await wrapper.instance().copyPaymentReturnUrl();
    expect(writeText).not.toHaveBeenCalled();
    expect(successToast).not.toHaveBeenCalled();
  });

  it("should copy the payment link when the input or button is clicked", async () => {
    const paymentUrl = "https://payment.example.com/pay/1?order=123";
    const paymentReturnUrl =
      "https://wifi.example.com/default/login?n=pay&sid=secret";
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {writeText},
    });
    const successToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_url: paymentUrl,
        payment_return_url: paymentReturnUrl,
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    await wrapper.find("input#payment-link").prop("onClick")();
    await wrapper.find("button.payment-link-copy").prop("onClick")();
    expect(writeText).toHaveBeenNthCalledWith(1, paymentReturnUrl);
    expect(writeText).toHaveBeenNthCalledWith(2, paymentReturnUrl);
    expect(writeText).not.toHaveBeenCalledWith(paymentUrl);
    expect(successToast).toHaveBeenCalledWith(t`PAY_LINK_COPIED`, {
      autoClose: 3000,
    });
    expect(props.authenticate).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("should wait for clipboard success before confirming the copy", async () => {
    const paymentReturnUrl =
      "https://wifi.example.com/default/login?n=pay&sid=secret";
    let resolveCopy;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: jest.fn(
          () =>
            new Promise((resolve) => {
              resolveCopy = resolve;
            }),
        ),
      },
    });
    const successToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_url: "https://payment.example.com/pay/1?order=123",
        payment_return_url: paymentReturnUrl,
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    const copy = wrapper.instance().copyPaymentReturnUrl();
    expect(successToast).not.toHaveBeenCalled();
    resolveCopy();
    await copy;
    expect(successToast).toHaveBeenCalledWith(t`PAY_LINK_COPIED`, {
      autoClose: 3000,
    });
  });

  it("should fall back to the selected input when Clipboard API access fails", async () => {
    const paymentReturnUrl =
      "https://wifi.example.com/default/login?n=pay&sid=secret";
    const focus = jest.fn();
    const select = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {writeText: jest.fn().mockRejectedValue(new Error("Denied"))},
    });
    document.execCommand = jest.fn().mockReturnValue(true);
    const successToast = jest.spyOn(toast, "success");
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_url: "https://payment.example.com/pay/1?order=123",
        payment_return_url: paymentReturnUrl,
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.instance().paymentReturnUrlInput.current = {focus, select};
    await wrapper.instance().copyPaymentReturnUrl();
    expect(focus).toHaveBeenCalled();
    expect(select).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(successToast).toHaveBeenCalledWith(t`PAY_LINK_COPIED`, {
      autoClose: 3000,
    });
  });

  it("should surface a copy error when manual copying is required", async () => {
    const paymentReturnUrl =
      "https://wifi.example.com/default/login?n=pay&sid=secret";
    const focus = jest.fn();
    const select = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {writeText: jest.fn().mockRejectedValue(new Error("Denied"))},
    });
    document.execCommand = jest.fn().mockReturnValue(false);
    const successToast = jest.spyOn(toast, "success");
    const errorToast = jest.spyOn(toast, "error");
    props = createTestProps({
      userData: {
        ...responseData,
        is_verified: false,
        payment_url: "https://payment.example.com/pay/1?order=123",
        payment_return_url: paymentReturnUrl,
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    wrapper.instance().paymentReturnUrlInput.current = {focus, select};
    await wrapper.instance().copyPaymentReturnUrl();
    expect(focus).toHaveBeenCalled();
    expect(select).toHaveBeenCalled();
    expect(successToast).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith(t`PAY_LINK_COPY_FAIL`);
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      "Unable to copy payment link",
    );
  });

  it("should not set mustLogin on draft arrival for an upgrade not requiring internet", async () => {
    props = createTestProps({
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
        payment_requires_internet: false,
      },
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    expect(wrapper.find("Navigate").length).toEqual(0);
    const payProcButton = wrapper
      .find("Link.button.full")
      .findWhere((node) => node.text() === t`PAY_PROC_BTN`)
      .first();
    expect(payProcButton.length).toEqual(1);
    expect(wrapper.instance().props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({mustLogin: undefined}),
    );
  });

  it("should log out of captive portal (not of the app) when going back from the upgrade draft page", async () => {
    props = createTestProps({
      settings: {
        subscriptions: true,
        mobile_phone_verification: true,
        payment_requires_internet: true,
      },
      userData: {
        ...responseData,
        method: "mobile_phone",
        is_verified: true,
        in_upgrade: true,
        payment_url: "https://payment.example.com/pay/1",
      },
      params: {status: "draft"},
    });
    validateToken.mockReturnValue(true);
    wrapper = shallow(<PaymentStatus {...props} />, {
      context: loadingContextValue,
    });
    await tick();
    // componentDidMount sets mustLogin so /status performs captive-portal login on proceed
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({mustLogin: true}),
    );
    wrapper.find("button.button.full").simulate("click", {});
    await tick();
    expect(cancelUpgradePlan).toHaveBeenCalledWith(
      props.orgSlug,
      props.userData.auth_token || props.userData.key,
      props.language,
    );
    // Clear stale flags to prevent /status redirecting back to /payment/draft
    expect(props.setUserData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        in_upgrade: false,
        proceedToPayment: false,
        payment_url: null,
        payment_return_url: null,
        mustLogin: undefined,
        mustLogout: true,
        captivePortalLogoutOnly: true,
      }),
    );
    expect(props.navigate).toHaveBeenCalledWith(`/${props.orgSlug}/status`);
    // Keep WLP session intact; only tear down captive portal session
    expect(props.logout).not.toHaveBeenCalled();
  });
});
