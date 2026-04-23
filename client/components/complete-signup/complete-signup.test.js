/* eslint-disable prefer-promise-reject-errors */
import React from "react";
import {shallow} from "enzyme";
import {toast} from "react-toastify";
import PropTypes from "prop-types";

import {t} from "ttag";
import {loadingContextValue} from "../../utils/loading-context";
import CompleteSignup from "./complete-signup";
import getPlans from "../../utils/get-plans";
import upgradePlan from "../../utils/upgrade-plan";
import updateRegistrationMethod from "../../utils/update-registration-method";

jest.mock("../../utils/update-registration-method");
jest.mock("../../utils/get-plans");
jest.mock("../../utils/upgrade-plan");

const plans = [
  {
    id: "free-plan",
    plan: "Free",
    pricing: "no expiration (free) (0 days)",
    plan_description: "free plan",
    currency: "EUR",
    requires_payment: false,
    requires_invoice: false,
    price: "0.00",
  },
  {
    id: "paid-plan",
    plan: "Premium",
    pricing: "per year (365 days)",
    plan_description: "paid plan",
    currency: "EUR",
    requires_payment: true,
    requires_invoice: false,
    price: "9.99",
  },
];

const createTestProps = (props) => ({
  orgSlug: "default",
  orgName: "Default",
  settings: {
    mobile_phone_verification: true,
    subscriptions: true,
  },
  defaultLanguage: "en",
  userData: {
    auth_token: "test-token",
    method: "pending_verification",
  },
  setTitle: jest.fn(),
  setUserData: jest.fn(),
  navigate: jest.fn(),
  language: "en",
  ...props,
});

describe("<CompleteSignup />", () => {
  let props;
  let wrapper;

  beforeEach(() => {
    props = createTestProps();
    updateRegistrationMethod.mockReset();
    getPlans.mockReset();
    upgradePlan.mockReset();
    CompleteSignup.contextTypes = {
      setLoading: PropTypes.func,
    };
    wrapper = shallow(<CompleteSignup {...props} />, {
      context: loadingContextValue,
    });
  });

  it("fetches plans when subscriptions are enabled", () => {
    expect(getPlans).toHaveBeenCalledWith(
      "default",
      "en",
      wrapper.instance().handlePlansSuccess,
      wrapper.instance().handlePlansFailure,
    );
  });

  it("auto-transitions to phone verification when subscriptions are disabled", async () => {
    getPlans.mockClear();
    props = createTestProps({
      settings: {
        mobile_phone_verification: true,
        subscriptions: false,
      },
    });
    updateRegistrationMethod.mockResolvedValue({method: "mobile_phone"});

    wrapper = shallow(<CompleteSignup {...props} />, {
      context: loadingContextValue,
    });

    await Promise.resolve();

    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "mobile_phone",
      "test-token",
      "en",
    );
    expect(getPlans).not.toHaveBeenCalled();
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({method: "mobile_phone"}),
    );
    expect(props.navigate).toHaveBeenCalledWith(
      "/default/mobile-phone-verification",
    );
  });

  it("auto-transitions to status when subscriptions and phone verification are disabled", async () => {
    getPlans.mockClear();
    props = createTestProps({
      settings: {
        mobile_phone_verification: false,
        subscriptions: false,
      },
    });
    updateRegistrationMethod.mockResolvedValue({method: ""});
    wrapper = shallow(<CompleteSignup {...props} />, {
      context: loadingContextValue,
    });
    await Promise.resolve();
    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "",
      "test-token",
      "en",
    );
    expect(getPlans).not.toHaveBeenCalled();
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({method: ""}),
    );
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("shows error toast when auto-transition fails", async () => {
    getPlans.mockClear();
    props = createTestProps({
      settings: {
        mobile_phone_verification: true,
        subscriptions: false,
      },
    });
    const errorToast = jest.spyOn(toast, "error").mockImplementation(() => {});
    updateRegistrationMethod.mockRejectedValue({
      response: {data: {detail: "token expired"}},
    });

    wrapper = shallow(<CompleteSignup {...props} />, {
      context: loadingContextValue,
    });

    await Promise.resolve();

    expect(errorToast).toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("shows generic error toast when auto-transition fails without response", async () => {
    getPlans.mockClear();
    props = createTestProps({
      settings: {
        mobile_phone_verification: false,
        subscriptions: false,
      },
    });
    const errorToast = jest.spyOn(toast, "error").mockImplementation(() => {});
    updateRegistrationMethod.mockRejectedValue(new Error("network error"));

    wrapper = shallow(<CompleteSignup {...props} />, {
      context: loadingContextValue,
    });

    await Promise.resolve();

    expect(errorToast).toHaveBeenCalledWith(t`ERR_OCCUR`);
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("renders generic copy with organization name", () => {
    expect(wrapper.text()).toContain(t`REGISTRATION_COMPLETE_PROMPT`);
    expect(wrapper.text()).toContain("Default");
  });

  it("shows plans after successful fetch", () => {
    wrapper.instance().handlePlansSuccess(plans);

    expect(wrapper.find(".plans")).toHaveLength(1);
  });

  it("shows error UI when plans fetch fails", () => {
    wrapper.instance().handlePlansFailure();

    expect(wrapper.find(".complete-signup-error")).toHaveLength(1);
    expect(wrapper.find(".plans")).toHaveLength(0);
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("shows message when plans fetch returns empty array", () => {
    wrapper.instance().handlePlansSuccess([]);

    expect(wrapper.find(".complete-signup-error")).toHaveLength(1);
    expect(wrapper.find(".plans")).toHaveLength(0);
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("retries plan fetch on retry button click", () => {
    wrapper.instance().handlePlansFailure();
    wrapper.instance().handlePlansRetry();

    expect(getPlans).toHaveBeenCalledWith(
      "default",
      "en",
      wrapper.instance().handlePlansSuccess,
      wrapper.instance().handlePlansFailure,
    );
  });

  it("clears retry state before fetching plans again", () => {
    wrapper.instance().handlePlansFailure();
    wrapper.setState({message: "Registration is disabled"});

    wrapper.instance().handlePlansRetry();

    expect(wrapper.instance().state.plansError).toBe(null);
    expect(wrapper.instance().state.message).toBe(null);
  });

  it("shows disabled registration message when plans are null", () => {
    wrapper.instance().handlePlansSuccess(null);

    expect(wrapper.find(".complete-signup-error")).toHaveLength(1);
    expect(wrapper.find(".plans")).toHaveLength(0);
  });

  it("handles free plan selection with phone verification enabled", async () => {
    upgradePlan.mockResolvedValue({});
    updateRegistrationMethod.mockResolvedValue({method: "mobile_phone"});
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitPlan(0);

    expect(upgradePlan).toHaveBeenCalledWith(
      "default",
      "free-plan",
      "test-token",
      "en",
    );
    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "mobile_phone",
      "test-token",
      "en",
    );
    expect(props.navigate).toHaveBeenCalledWith(
      "/default/mobile-phone-verification",
    );
  });

  it("handles free plan selection without phone verification", async () => {
    props = createTestProps({
      settings: {
        mobile_phone_verification: false,
        subscriptions: true,
      },
    });
    wrapper = shallow(<CompleteSignup {...props} />, {
      context: loadingContextValue,
    });
    upgradePlan.mockResolvedValue({});
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitPlan(0);

    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "",
      "test-token",
      "en",
    );
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({method: ""}),
    );
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("submits paid plan and redirects to payment draft", async () => {
    updateRegistrationMethod.mockResolvedValue({method: "bank_card"});
    upgradePlan.mockResolvedValue({
      payment_url: "https://payment.example/1",
    });
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitPlan(1);

    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "bank_card",
      "test-token",
      "en",
    );
    expect(upgradePlan).toHaveBeenCalledWith(
      "default",
      "paid-plan",
      "test-token",
      "en",
    );
    expect(props.setUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "bank_card",
        payment_url: "https://payment.example/1",
      }),
    );
    expect(props.navigate).toHaveBeenCalledWith("/default/payment/draft");
  });

  it("ignores invalid plan submission indexes", async () => {
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitPlan(9);

    expect(upgradePlan).not.toHaveBeenCalled();
    expect(updateRegistrationMethod).not.toHaveBeenCalled();
    expect(props.navigate).not.toHaveBeenCalled();
  });

  it("submits plans from handlePlanChange when the selection is valid", () => {
    const handleSubmitPlan = jest
      .spyOn(wrapper.instance(), "handleSubmitPlan")
      .mockImplementation(() => Promise.resolve());
    wrapper.instance().handlePlansSuccess(plans);

    wrapper.instance().handlePlanChange({target: {value: "0"}});

    expect(wrapper.instance().state.selectedPlan).toBe("0");
    expect(handleSubmitPlan).toHaveBeenCalledWith("0");
  });

  it("ignores invalid selections in handlePlanChange", () => {
    const handleSubmitPlan = jest
      .spyOn(wrapper.instance(), "handleSubmitPlan")
      .mockImplementation(() => Promise.resolve());
    wrapper.instance().handlePlansSuccess(plans);

    wrapper.instance().handlePlanChange({target: {value: "10"}});

    expect(wrapper.instance().state.selectedPlan).toBe(null);
    expect(handleSubmitPlan).not.toHaveBeenCalled();
  });

  it("shows an error toast when plan submission fails", async () => {
    const errorToast = jest.spyOn(toast, "error").mockImplementation(() => {});
    updateRegistrationMethod.mockRejectedValue({
      response: {data: {detail: "bad request"}},
    });
    upgradePlan.mockResolvedValue({});
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitPlan(0);

    expect(props.navigate).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalled();
  });

  it("shows generic error toast when plan submission fails without response", async () => {
    const errorToast = jest.spyOn(toast, "error").mockImplementation(() => {});
    upgradePlan.mockRejectedValue(new Error("network error"));
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitPlan(0);

    expect(props.navigate).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalledWith(t`ERR_OCCUR`);
  });

  it("does not set local state after unmount", () => {
    const setStateSpy = jest.spyOn(wrapper.instance(), "setState");

    wrapper.instance().componentWillUnmount();
    wrapper.instance().setStateSafe({submittingMethod: "mobile_phone"});

    expect(setStateSpy).not.toHaveBeenCalled();
  });
});
