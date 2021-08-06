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

jest.mock("../../utils/get-config");
jest.mock("axios");

const createTestProps = function (props, configName = "default") {
  const config = getConfig(configName);
  return {
    orgSlug: configName,
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
    verifies_identity: false,
    price: "0.00",
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

Registration.contextTypes = {
  setLoading: PropTypes.func,
  getLoading: PropTypes.func,
};

describe("test subscriptions", () => {
  let props;
  let wrapper;
  let originalError;
  let lastConsoleOutuput;
  const event = {preventDefault: jest.fn()};
  const initShallow = (passedProps) =>
    shallow(<Registration {...passedProps} />, {
      context: loadingContextValue,
    });

  beforeEach(() => {
    originalError = console.error;
    lastConsoleOutuput = null;
    console.error = (data) => {
      lastConsoleOutuput = data;
    };
    props = createTestProps();
    props.settings.subscriptions = true;
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

  it("should show choice form when plans is present", () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );
    wrapper = initShallow(props);
    wrapper.instance().setState({plans, plansFetched: true});
    expect(wrapper.find("input[name='plan_selection']").length).toBe(2);
    expect(lastConsoleOutuput).toBe(null);
  });

  it("show billing info only when verifies_identity is true", () => {
    axios.mockImplementationOnce(() =>
      Promise.resolve({
        status: 201,
        statusText: "ok",
        data: plans,
      }),
    );
    wrapper = initShallow(props);
    wrapper.instance().setState({plans, selected_plan: 0, plansFetched: true});
    expect(wrapper.find(".billing-info").length).toBe(0);
    expect(wrapper.find("input[name='username']").length).toBe(0);
    wrapper.instance().setState({selected_plan: 1});
    expect(wrapper.find(".billing-info").length).toBe(1);
    expect(wrapper.find("input[name='username']").length).toBe(1);
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
    registration.setState({plans, selected_plan: 1, plansFetched: true});
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
