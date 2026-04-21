/* eslint-disable prefer-promise-reject-errors */
import React from "react";
import {shallow} from "enzyme";
import {toast} from "react-toastify";
import PropTypes from "prop-types";

import {loadingContextValue} from "../../utils/loading-context";
import CompleteSignup from "./complete-signup";
import getPlans from "../../utils/get-plans";
import upgradePendingVerificationPlan from "../../utils/upgrade-pending-verification-plan";
import updateRegistrationMethod from "../../utils/update-registration-method";

jest.mock("../../utils/update-registration-method");
jest.mock("../../utils/get-plans");
jest.mock("../../utils/upgrade-pending-verification-plan");

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
    upgradePendingVerificationPlan.mockReset();
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
    expect(props.navigate).toHaveBeenCalledWith(
      "/default/mobile-phone-verification",
    );
  });

  it("renders generic copy with organization name", () => {
    expect(wrapper.text()).toContain("Please complete your registration to");
    expect(wrapper.text()).toContain("Default");
  });

  it("shows plans after successful fetch", () => {
    wrapper.instance().handlePlansSuccess(plans);

    expect(wrapper.find(".plans")).toHaveLength(1);
  });

  it("handles free plan selection with phone verification enabled", async () => {
    upgradePendingVerificationPlan.mockResolvedValue({});
    updateRegistrationMethod.mockResolvedValue({method: "mobile_phone"});
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitFreePlan(0);

    expect(upgradePendingVerificationPlan).toHaveBeenCalledWith(
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
    upgradePendingVerificationPlan.mockResolvedValue({});
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitFreePlan(0);

    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "",
      "test-token",
      "en",
    );
    expect(props.navigate).toHaveBeenCalledWith("/default/status");
  });

  it("does not submit paid plan on focus", () => {
    wrapper.instance().handlePlansSuccess(plans);

    wrapper.instance().handlePlanFocus({target: {value: "1"}});

    expect(wrapper.state("selectedPlan")).toBe("1");
    expect(updateRegistrationMethod).not.toHaveBeenCalled();
    expect(upgradePendingVerificationPlan).not.toHaveBeenCalled();
  });

  it("submits paid plan and redirects to payment draft", async () => {
    updateRegistrationMethod.mockResolvedValue({method: "bank_card"});
    upgradePendingVerificationPlan.mockResolvedValue({
      payment_url: "https://payment.example/1",
    });
    wrapper.instance().handlePlansSuccess(plans);
    wrapper.setState({selectedPlan: "1"});

    await wrapper.instance().handleSubmitPaidPlan();

    expect(updateRegistrationMethod).toHaveBeenCalledWith(
      "default",
      "bank_card",
      "test-token",
      "en",
    );
    expect(upgradePendingVerificationPlan).toHaveBeenCalledWith(
      "default",
      "paid-plan",
      "test-token",
      "en",
    );
    expect(props.navigate).toHaveBeenCalledWith("/default/payment/draft");
  });

  it("shows an error toast when free plan submission fails", async () => {
    const errorToast = jest.spyOn(toast, "error").mockImplementation(() => {});
    updateRegistrationMethod.mockRejectedValue({
      response: {data: {detail: "bad request"}},
    });
    upgradePendingVerificationPlan.mockResolvedValue({});
    wrapper.instance().handlePlansSuccess(plans);

    await wrapper.instance().handleSubmitFreePlan(0);

    expect(props.navigate).not.toHaveBeenCalled();
    expect(errorToast).toHaveBeenCalled();
  });

  it("does not set local state after unmount", () => {
    const setStateSpy = jest.spyOn(wrapper.instance(), "setState");

    wrapper.instance().componentWillUnmount();
    wrapper.instance().setStateSafe({submittingMethod: "mobile_phone"});

    expect(setStateSpy).not.toHaveBeenCalled();
  });
});
