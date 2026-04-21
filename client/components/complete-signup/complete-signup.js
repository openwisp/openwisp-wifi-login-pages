/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {toast} from "react-toastify";
import {t, jt} from "ttag";

import LoadingContext from "../../utils/loading-context";
import getErrorText from "../../utils/get-error-text";
import getError from "../../utils/get-error";
import getPlanSelection from "../../utils/get-plan-selection";
import getPlans from "../../utils/get-plans";
import logError from "../../utils/log-error";
import {getVerificationRoute} from "../../utils/pending-verification";
import upgradePendingVerificationPlan from "../../utils/upgrade-pending-verification-plan";
import updateRegistrationMethod from "../../utils/update-registration-method";
import Contact from "../contact-box";

export default class CompleteSignup extends React.Component {
  constructor(props) {
    super(props);
    this.isComponentMounted = true;
    this.state = {
      errors: {},
      plans: [],
      plansFetched: false,
      selectedPlan: null,
    };
  }

  setStateSafe(state, callback) {
    if (this.isComponentMounted) {
      this.setState(state, callback);
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  componentDidMount() {
    const {setLoading} = this.context;
    const {
      setTitle,
      orgName,
      settings,
      orgSlug,
      language,
      userData,
      setUserData,
      navigate,
    } = this.props;
    setLoading(false);
    setTitle(t`REGISTRATION_TITLE`, orgName);
    if (!settings.subscriptions) {
      this.handleAutoTransition({
        orgSlug,
        userData,
        setUserData,
        navigate,
        settings,
        language,
      });
      return;
    }
    getPlans(
      orgSlug,
      language,
      this.handlePlansSuccess,
      this.handlePlansFailure,
    );
  }

  handlePlansSuccess = (plans) => {
    this.setStateSafe({plans, plansFetched: true});
  };

  handlePlansFailure = () => {
    this.setStateSafe({plans: [], plansFetched: true});
  };

  setFormErrors = (data = {}) => {
    const formData = {...data};
    this.setStateSafe({
      errors: {
        ...(formData.first_name
          ? {first_name: formData.first_name.toString()}
          : {}),
        ...(formData.last_name
          ? {last_name: formData.last_name.toString()}
          : {}),
      },
    });
  };

  handleFlowError = (error) => {
    const response = error.response || {};
    const data = response.data || {};
    this.setFormErrors(data);
    const errorText = error.response
      ? getErrorText(error, t`ERR_OCCUR`)
      : t`ERR_OCCUR`;
    logError(error, errorText);
    toast.error(errorText);
  };

  handleAutoTransition = async ({
    orgSlug,
    userData,
    setUserData,
    navigate,
    settings,
    language,
  }) => {
    const {setLoading} = this.context;
    setLoading(true);
    try {
      const nextUserData = {...userData};
      if (settings.mobile_phone_verification) {
        await updateRegistrationMethod(
          orgSlug,
          "mobile_phone",
          userData.auth_token,
          language,
        );
        nextUserData.method = "mobile_phone";
        setUserData(nextUserData);
        navigate(getVerificationRoute(orgSlug, "mobile_phone"));
        return;
      }
      await updateRegistrationMethod(
        orgSlug,
        "",
        userData.auth_token,
        language,
      );
      nextUserData.method = "";
      setUserData(nextUserData);
      navigate(`/${orgSlug}/status`);
    } catch (error) {
      this.handleFlowError(error);
    } finally {
      setLoading(false);
    }
  };

  handleSubmitFreePlan = async (
    selectedPlanIndex,
    selectedPlanOverride,
    propsOverride,
  ) => {
    const {setLoading} = this.context;
    const {orgSlug, userData, setUserData, navigate, settings, language} =
      propsOverride || this.props;
    const {plans} = this.state;
    const selectedPlan = selectedPlanOverride || plans[selectedPlanIndex];

    this.setStateSafe({errors: {}});
    setLoading(true);
    try {
      const nextUserData = {...userData};
      if (selectedPlan && selectedPlan.id) {
        await upgradePendingVerificationPlan(
          orgSlug,
          selectedPlan.id,
          userData.auth_token,
          language,
        );
      }
      if (settings.mobile_phone_verification) {
        await updateRegistrationMethod(
          orgSlug,
          "mobile_phone",
          userData.auth_token,
          language,
        );
        nextUserData.method = "mobile_phone";
        setUserData(nextUserData);
        navigate(getVerificationRoute(orgSlug, "mobile_phone"));
        return;
      }
      await updateRegistrationMethod(
        orgSlug,
        "",
        userData.auth_token,
        language,
      );
      nextUserData.method = "";
      setUserData(nextUserData);
      navigate(`/${orgSlug}/status`);
    } catch (error) {
      this.handleFlowError(error);
    } finally {
      setLoading(false);
    }
  };

  handleSubmitPaidPlan = async (selectedPlanIndex) => {
    const {setLoading} = this.context;
    const {orgSlug, userData, setUserData, navigate, language} = this.props;
    const {plans, selectedPlan} = this.state;
    const planIndex =
      selectedPlanIndex === undefined ? selectedPlan : selectedPlanIndex;
    const selectedPlanData = plans[planIndex];

    if (!selectedPlanData) {
      return;
    }

    this.setStateSafe({
      selectedPlan: planIndex,
      errors: {},
    });
    setLoading(true);
    try {
      await updateRegistrationMethod(
        orgSlug,
        "bank_card",
        userData.auth_token,
        language,
      );
      const nextUserData = {...userData, method: "bank_card"};
      const response = await upgradePendingVerificationPlan(
        orgSlug,
        selectedPlanData.id,
        userData.auth_token,
        language,
      );
      nextUserData.payment_url = response.payment_url;
      setUserData(nextUserData);
      navigate(getVerificationRoute(orgSlug, "bank_card"));
    } catch (error) {
      this.handleFlowError(error);
    } finally {
      setLoading(false);
    }
  };

  handlePlanChange = (event) => {
    const planIndex = event.target.value;
    const {plans} = this.state;
    const selectedPlan = plans[planIndex];
    this.setStateSafe({selectedPlan: planIndex});
    if (!selectedPlan) {
      return;
    }
    if (selectedPlan.requires_payment) {
      this.handleSubmitPaidPlan(planIndex);
      return;
    }
    this.handleSubmitFreePlan(planIndex);
  };

  handlePlanFocus = (event) => {
    this.setStateSafe({selectedPlan: event.target.value});
  };

  render() {
    const {defaultLanguage, orgName, settings} = this.props;
    const {plans, plansFetched, selectedPlan, errors} = this.state;

    return (
      <div className="container content" id="complete-signup">
        <div className="inner">
          <div className="main-column single">
            <div className="inner">
              <h2 className="row">{t`REGISTRATION_TITLE`}</h2>
              <div className="row">
                {jt`Please complete your registration to ${orgName}.`}
              </div>
              {getError(errors)}
              {settings.subscriptions && plansFetched && (
                <div className="row complete-signup-plans">
                  {getPlanSelection(
                    defaultLanguage,
                    plans,
                    selectedPlan,
                    this.handlePlanChange,
                    this.handlePlanFocus,
                    false,
                  )}
                </div>
              )}
            </div>
          </div>
          <Contact />
        </div>
      </div>
    );
  }
}

CompleteSignup.contextType = LoadingContext;
CompleteSignup.propTypes = {
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
    subscriptions: PropTypes.bool,
  }).isRequired,
  defaultLanguage: PropTypes.string.isRequired,
  userData: PropTypes.shape({
    auth_token: PropTypes.string,
  }).isRequired,
  setTitle: PropTypes.func.isRequired,
  setUserData: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
};
