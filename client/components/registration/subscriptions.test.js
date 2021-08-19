/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {toast} from "react-toastify";
import {loadingContextValue} from "../../utils/loading-context";
import tick from "../../utils/tick";
import getConfig from "../../utils/get-config";
import Registration from "./registration";
import mountComponent from "./test-utils";

jest.mock("../../utils/get-config");
jest.mock("axios");

const createTestProps = function (props, configName = "default") {
  const config = getConfig(configName);
  return {
    orgSlug: configName,
    orgName: "test",
    settings: config.settings,
    registration: config.components.registration_form,
    privacyPolicy: config.privacy_policy,
    termsAndConditions: config.terms_and_conditions,
    authenticate: jest.fn(),
    verifyMobileNumber: jest.fn(),
    setTitle: jest.fn(),
    match: {
      path: "default/registration",
    },
    ...props,
  };
};

const plans = [
  {
    id: "00589a26-4855-43c4-acbc-a8cfaf25807d",
    plan: "Free",
    pricing: "no expiration (free) (0 days)",
    plan_description: "3 hours per day\n300 MB per day",
    currency: "EUR",
    requires_payment: false,
    requires_invoice: false,
    price: "0.00",
    has_automatic_renewal: false,
  },
  {
    id: "d1403161-75cd-4492-bccd-054eee9e155a",
    plan: "Premium",
    pricing: "per year (365 days)",
    plan_description: "Unlimited time and traffic",
    currency: "EUR",
    requires_payment: true,
    requires_invoice: true,
    price: "9.99",
    has_automatic_renewal: false,
  },
  {
    id: "363c9ba3-3354-48a5-a3e3-86062b070036",
    plan: "Free (used for identity verification)",
    pricing: "no expiration (free) (0 days)",
    plan_description: "3 hours per day\n300 MB per day",
    currency: "EUR",
    requires_payment: true,
    requires_invoice: false,
    price: "0.00",
    has_automatic_renewal: false,
  },
];

describe("test subscriptions", () => {
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;
  const event = {preventDefault: jest.fn()};
  const initShallow = (passedProps) => {
    Registration.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    return shallow(<Registration {...passedProps} />, {
      context: loadingContextValue,
    });
  };

  beforeEach(() => {
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
    props = createTestProps();
    props.settings.subscriptions = true;
    props.configuration = getConfig("default", true);
  });
  afterEach(() => {
    console.error = originalError;
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should not show choice form when plans is absent", () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: [],
      }),
    );
    wrapper = initShallow(props);
    expect(wrapper.find("input[name='plan_selection']").length).toBe(0);
  });

  it("should plan selection when multiple plans are present", () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );
    wrapper = initShallow(props);
    wrapper.instance().setState({plans, plansFetched: true});
    expect(wrapper.find("input[name='plan_selection']").length).toBe(3);
    expect(lastConsoleOutuput).toBe(null);
    expect(wrapper.find(".plan").length).toBe(3);
    expect(wrapper.find("#radio0").exists()).toBe(true);
    expect(wrapper.find("#radio1").exists()).toBe(true);

    // form inputs not visible
    expect(wrapper.find(".row.register").exists()).toBe(true);
    expect(wrapper.find(".row.username").exists()).toBe(false);
    expect(wrapper.find(".row.email").exists()).toBe(false);

    // show first plan
    wrapper.find("#radio0").simulate("focus", {target: {value: "0"}});
    expect(wrapper.instance().state.selectedPlan).toBe("0");
    expect(wrapper.find(".row.email").exists()).toBe(true);
    expect(wrapper.find(".row.username").exists()).toBe(false);
    expect(wrapper.find(".plan.active").length).toBe(1);
    expect(wrapper.find(".plan.inactive").length).toBe(2);

    // show second plan
    wrapper.find("#radio1").simulate("focus", {target: {value: "1"}});
    expect(wrapper.instance().state.selectedPlan).toBe("1");
    expect(wrapper.find(".row.email").exists()).toBe(true);
    expect(wrapper.find(".row.username").exists()).toBe(true);
    expect(wrapper.find(".plan.active").length).toBe(1);
    expect(wrapper.find(".plan.inactive").length).toBe(2);
  });

  it("should not show billing info when requires_payment is false", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );
    props.settings.mobile_phone_verification = true;
    wrapper = await mountComponent(props);
    wrapper.find(Registration).instance().setState({selectedPlan: 0});
    wrapper.update();
    expect(wrapper.find(Registration).instance().state.plans).toBe(plans);
    expect(wrapper.find(Registration).instance().state.plansFetched).toBe(true);
    expect(wrapper.find("input[name='plan_selection']").length).toBe(3);
    expect(wrapper.find(Registration).find("form")).toHaveLength(1);
    expect(wrapper.find(".billing-info").length).toBe(0);
    expect(wrapper.find("input[name='username']").length).toBe(0);
    // phone_number field should be rendered since
    // this plan does not require a payment
    expect(wrapper.find("input[name='phone_number']").length).toBe(1);
  });

  it("should not show billing info when requires_payment is true but requires_invoice is false", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );
    wrapper = await mountComponent(props);
    expect(wrapper.find(Registration).instance().state.plans).toBe(plans);
    expect(wrapper.find(Registration).instance().state.plansFetched).toBe(true);
    wrapper.find(Registration).instance().setState({selectedPlan: 2});
    wrapper.update();
    expect(wrapper.find(".billing-info").length).toBe(0);
    expect(wrapper.find("input[name='username']").length).toBe(1);
    // phone_number field should not be rendered on plans that requires payment
    expect(wrapper.find("input[name='phone_number']").length).toBe(0);
  });

  it("should show billing info when both requires_payment and requires_invoice is true", async () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );
    wrapper = await mountComponent(props);
    expect(wrapper.find(Registration).instance().state.plans).toBe(plans);
    expect(wrapper.find(Registration).instance().state.plansFetched).toBe(true);
    wrapper.find(Registration).instance().setState({selectedPlan: 1});
    wrapper.update();
    expect(wrapper.find(".billing-info").length).toBe(1);
    expect(wrapper.find("input[name='username']").length).toBe(1);
    // phone_number field should not be rendered on plans that requires payment
    expect(wrapper.find("input[name='phone_number']").length).toBe(0);
  });

  it("authenticate normally after registration with payment flow", async () => {
    const data = {payment_url: "https://account.openwisp.io/payment/123"};
    axios
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "ok",
          data: plans,
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data,
        }),
      );
    wrapper = initShallow(props);
    const registration = wrapper.instance();
    const handleSubmit = jest.spyOn(registration, "handleSubmit");
    registration.setState({plans, selectedPlan: 1, plansFetched: true});
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const mockVerify = registration.props.verifyMobileNumber;
    expect(mockVerify.mock.calls.length).toBe(0);
    const authenticateMock = registration.props.authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });

  it("should show error if fetching plans fail", async () => {
    axios.mockImplementationOnce(() =>
      Promise.reject({
        status: 500,
        statusText: "Internal server error",
        response: {
          data: {
            detail: "Internal server error",
          },
        },
      }),
    );
    const spyToast = jest.spyOn(toast, "error");
    wrapper = initShallow(props);
    await tick();
    expect(spyToast.mock.calls.length).toBe(1);
  });
});
