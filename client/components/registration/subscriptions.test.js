/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
import axios from "axios";
import {shallow} from "enzyme";
import React from "react";
import PropTypes from "prop-types";
import {loadingContextValue} from "../../utils/loading-context";
import tick from "../../utils/tick";

import getConfig from "../../utils/get-config";
import Registration from "./registration";

jest.mock("../../utils/get-config");
jest.mock("axios");

const createTestProps = function (props, configName = "default") {
  const config = getConfig(configName);
  return {
    language: "en",
    orgSlug: configName,
    settings: config.settings,
    registration: config.components.registration_form,
    privacyPolicy: config.privacy_policy,
    termsAndConditions: config.terms_and_conditions,
    authenticate: jest.fn(),
    verifyMobileNumber: jest.fn(),
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
    verifies_identity: false,
    price: "0.00",
    has_automatic_renewal: false,
  },
  {
    id: "3c60f25c-638d-43ae-9078-32697efca766",
    plan: "Premium",
    pricing: "per month (30 days)",
    plan_description: "Unlimited time and traffic",
    currency: "EUR",
    verifies_identity: true,
    price: "1.99",
    has_automatic_renewal: false,
  },
  {
    id: "d1403161-75cd-4492-bccd-054eee9e155a",
    plan: "Premium",
    pricing: "per year (365 days)",
    plan_description: "Unlimited time and traffic",
    currency: "EUR",
    verifies_identity: true,
    price: "9.99",
    has_automatic_renewal: false,
  },
];

describe("test subscriptions", () => {
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;
  const event = {preventDefault: jest.fn()};

  beforeEach(() => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      });
    });
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
    props = createTestProps();
    Registration.contextTypes = {
      setLoading: PropTypes.func,
      getLoading: PropTypes.func,
    };
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
  });
  afterEach(() => {
    console.error = originalError;
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });
  it("should not show choice form when plans is abscent", () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 201,
        statusText: "ok",
        data: [],
      });
    });
    props = createTestProps();
    props.settings.subscriptions = true;
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
    expect(wrapper.find("input[name='plan_selection']").length).toBe(0);
  });
  it("should show choice form when plans is present", () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      });
    });
    props = createTestProps();
    props.settings.subscriptions = true;
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
    wrapper.instance().setState({plans, gotPlans: true});
    expect(wrapper.find("input[name='plan_selection']").length).toBe(3);
    expect(lastConsoleOutuput).toBe(null);
  });
  it("show billing info only when verifies_identity is true", () => {
    axios.mockImplementationOnce(() => {
      return Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      });
    });
    props = createTestProps();
    props.settings.subscriptions = true;
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
    wrapper.instance().setState({plans, selected_plan: 0, gotPlans: true});
    expect(wrapper.find(".billing-info").length).toBe(0);
    expect(wrapper.find("input[name='username']").length).toBe(0);
    wrapper.instance().setState({selected_plan: 1});
    expect(wrapper.find(".billing-info").length).toBe(1);
    expect(wrapper.find("input[name='username']").length).toBe(1);
  });
  it("authenticate normally after registration with payment flow", async () => {
    const data = {payment_url: "https://account.openwisp.io/payment/123"};
    axios
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 201,
          statusText: "ok",
          data: plans,
        });
      })
      .mockImplementationOnce(() => {
        return Promise.resolve({
          status: 201,
          statusText: "CREATED",
          data,
        });
      });
    props = createTestProps();
    props.settings.subscriptions = true;
    wrapper = shallow(<Registration {...props} />, {
      context: loadingContextValue,
    });
    const registration = wrapper.instance();
    const handleSubmit = jest.spyOn(registration, "handleSubmit");
    registration.setState({plans, selected_plan: 1, gotPlans: true});
    wrapper.find("form").simulate("submit", event);
    await tick();
    expect(handleSubmit).toHaveBeenCalled();
    const mockVerify = registration.props.verifyMobileNumber;
    expect(mockVerify.mock.calls.length).toBe(0);
    const authenticateMock = registration.props.authenticate.mock;
    expect(authenticateMock.calls.length).toBe(1);
    expect(authenticateMock.calls.pop()).toEqual([true]);
  });
});
