/* eslint-disable camelcase */
import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {toast} from "react-toastify";
import {t} from "ttag";

import LoadingContext from "../../utils/loading-context";
import getErrorText from "../../utils/get-error-text";
import getError from "../../utils/get-error";
import getPlanSelection from "../../utils/get-plan-selection";
import getPlans from "../../utils/get-plans";
import logError from "../../utils/log-error";
import {getVerificationRoute} from "../../utils/pending-verification";
import upgradePlan from "../../utils/upgrade-plan";
import updateRegistrationMethod from "../../utils/update-registration-method";
import Contact from "../contact-box";

const handleFlowError = (error, setErrorsState) => {
  const errorText = error.response
    ? getErrorText(error, t`ERR_OCCUR`)
    : t`ERR_OCCUR`;
  logError(error, errorText);
  toast.error(errorText);
  if (setErrorsState) {
    setErrorsState({nonfield: [errorText]});
  }
};

export default class CompleteSignup extends React.Component {
  constructor(props) {
    super(props);
    this.isComponentMounted = true;
    this.state = {
      errors: {},
      plans: [],
      plansFetched: false,
      plansError: null,
      selectedPlan: null,
      message: null,
      submitting: false,
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
    const {setTitle, orgName, settings, orgSlug, language, userData} =
      this.props;
    setTitle(t`REGISTRATION_TITLE`, orgName);
    setLoading(true);
    this.handleAutoTransition({
      orgSlug,
      userData,
      settings,
      language,
    });
  }

  /**
   * Handles success callback when plans are fetched successfully.
   * Differentiates between empty plans (org disabled registration)
   * vs HTTP errors.
   */
  handlePlansSuccess = (plans) => {
    const {setLoading} = this.context;
    const plansError = null;
    let message = null;

    if (!plans || plans.length === 0) {
      // Empty plans array (200 OK) means org has disabled registration
      message = t`ORG_REGISTRATION_DISABLED`;
    }
    this.setStateSafe({plans, plansFetched: true, plansError, message});
    setLoading(false);
  };

  /**
   * Handles failure callback when plans fail to fetch (network error, 500, etc).
   * Shows error toast and allows retry.
   */
  handlePlansFailure = () => {
    const {setLoading} = this.context;
    this.setStateSafe({
      plans: [],
      plansFetched: true,
      plansError: t`PLANS_FETCH_ERR`,
    });
    setLoading(false);
    toast.error(t`PLANS_FETCH_ERR`);
  };

  finalOperations = (nextUserData, route) => {
    const {setLoading} = this.context;
    const {setUserData, navigate} = this.props;
    if (this.isComponentMounted) {
      setUserData(nextUserData);
      navigate(route);
      setLoading(false);
    }
  };

  /**
   * Handles auto-transition based on organization settings.
   * - If subscriptions disabled: proceed with registration method update
   * - If subscriptions enabled: fetch plans and show plan selection UI
   */
  handleAutoTransition = async ({orgSlug, userData, settings, language}) => {
    const {setLoading} = this.context;
    // If subscriptions are disabled, proceed with auto-transition
    if (!settings.subscriptions) {
      try {
        if (settings.mobile_phone_verification) {
          // Update registration method to mobile_phone for verification
          await updateRegistrationMethod(
            orgSlug,
            "mobile_phone",
            userData.auth_token,
            language,
          );
          const nextUserData = {...userData, method: "mobile_phone"};
          this.finalOperations(
            nextUserData,
            getVerificationRoute(orgSlug, "mobile_phone"),
          );
          return;
        }
        // No mobile verification - go directly to status
        await updateRegistrationMethod(
          orgSlug,
          "",
          userData.auth_token,
          language,
        );
        const nextUserData = {...userData, method: ""};
        this.finalOperations(nextUserData, `/${orgSlug}/status`);
      } catch (error) {
        if (this.isComponentMounted) {
          handleFlowError(error, (errors) => this.setStateSafe({errors}));
          setLoading(false);
        }
      }
      return;
    }
    // Subscriptions enabled - fetch plans for selection
    getPlans(
      orgSlug,
      language,
      this.handlePlansSuccess,
      this.handlePlansFailure,
    );
  };

  /**
   * Unified handler for submitting a plan selection (free or paid).
   * Handles:
   * 1. Registering with the selected plan
   * 2. Updating registration method based on plan type and settings
   * 3. Navigating to appropriate verification flow
   *
   * @param {string} planIndex - Index of the selected plan in the plans array
   */
  handleSubmitPlan = async (planIndex) => {
    const {setLoading} = this.context;
    const {orgSlug, userData, setUserData, navigate, settings, language} =
      this.props;
    const {plans, submitting} = this.state;
    const selectedPlan = plans[planIndex];
    if (!selectedPlan || submitting) {
      return;
    }

    setLoading(true);
    this.setStateSafe({errors: {}, submitting: true});
    const requiresPayment = selectedPlan.requires_payment === true;

    try {
      // Upgrade to selected plan
      let paymentUrl = null;
      if (selectedPlan.id) {
        const response = await upgradePlan(
          orgSlug,
          selectedPlan.id,
          userData.auth_token,
          language,
        );
        paymentUrl = response.payment_url;
      }

      // Update registration method based on plan and settings
      // For paid plans, always use bank_card method
      // For free plans, check mobile_phone_verification setting
      let nextUserData;
      if (requiresPayment) {
        await updateRegistrationMethod(
          orgSlug,
          "bank_card",
          userData.auth_token,
          language,
        );
        nextUserData = {
          ...userData,
          method: "bank_card",
          payment_url: paymentUrl,
        };
        if (this.isComponentMounted) {
          setUserData(nextUserData);
          navigate(getVerificationRoute(orgSlug, "bank_card"));
          setLoading(false);
        }
        return;
      }

      // Free plan - check if mobile verification is enabled
      if (settings.mobile_phone_verification) {
        await updateRegistrationMethod(
          orgSlug,
          "mobile_phone",
          userData.auth_token,
          language,
        );
        nextUserData = {...userData, method: "mobile_phone"};
        this.finalOperations(
          nextUserData,
          getVerificationRoute(orgSlug, "mobile_phone"),
        );
        return;
      }

      // No mobile verification - go to status page
      await updateRegistrationMethod(
        orgSlug,
        "",
        userData.auth_token,
        language,
      );
      nextUserData = {...userData, method: ""};
      this.finalOperations(nextUserData, `/${orgSlug}/status`);
    } catch (error) {
      if (this.isComponentMounted) {
        handleFlowError(error, (errors) =>
          this.setStateSafe({errors, submitting: false}),
        );
        setLoading(false);
      }
    } finally {
      if (this.isComponentMounted) {
        this.setStateSafe({submitting: false});
      }
    }
  };

  handlePlanChange = (event) => {
    const planIndex = event.target.value;
    const {plans} = this.state;
    const selectedPlan = plans[planIndex];
    if (!selectedPlan) {
      return;
    }
    this.setStateSafe({selectedPlan: planIndex});
    this.handleSubmitPlan(planIndex);
  };

  handlePlansRetry = () => {
    const {orgSlug, language} = this.props;
    const {setLoading} = this.context;
    setLoading(true);
    this.setStateSafe({errors: {}, plansError: null, message: null}, () => {
      getPlans(
        orgSlug,
        language,
        this.handlePlansSuccess,
        this.handlePlansFailure,
      );
    });
  };

  render() {
    const {defaultLanguage, orgName, settings} = this.props;
    const {plans, plansFetched, plansError, message, selectedPlan, errors} =
      this.state;
    return (
      <div className="container content" id="complete-signup">
        <div className="inner">
          <div className="main-column single">
            <div className="inner">
              <h2 className="row">{t`REGISTRATION_TITLE`}</h2>
              <div className="row">
                {t`REGISTRATION_COMPLETE_PROMPT`} {orgName}.
              </div>
              {getError(errors)}
              {/* HTTP error state - show error with retry button */}
              {settings.subscriptions && plansFetched && plansError && (
                <div className="row complete-signup-error">
                  <div className="alert alert-danger">{plansError}</div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={this.handlePlansRetry}
                  >
                    {t`RETRY`}
                  </button>
                </div>
              )}
              {/* Empty plans (200 OK) - organization disabled registration */}
              {settings.subscriptions &&
                plansFetched &&
                !plansError &&
                message && (
                  <div className="row complete-signup-error">
                    <div className="alert alert-info">{message}</div>
                  </div>
                )}
              {/* Success state - show plan selection */}
              {settings.subscriptions &&
                plansFetched &&
                !plansError &&
                !message && (
                  <div className="row complete-signup-plans">
                    {getPlanSelection(
                      defaultLanguage,
                      plans,
                      selectedPlan,
                      this.handlePlanChange,
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
