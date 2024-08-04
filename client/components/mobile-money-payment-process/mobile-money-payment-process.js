/* eslint-disable camelcase */
import "./index.css";
// import "./assets/css/app.min.css";
import "./assets/css/bootstrap.min.css";
import "./assets/css/icons.min.css";
import "./assets/js/bootstrap.bundle.min";
import "./assets/js/feather.min";
import "./assets/js/lord-icon-2.1.0";
import "./assets/js/plugins";
import "./assets/js/simplebar.min";
import "./assets/js/waves.min";

import classnames from "classnames";
import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Cookies} from "react-cookie";
import {Link, Navigate} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {gettext, t} from "ttag";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";
import {buyPlanUrl, currentPlanApiUrl, plansApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import Contact from "../contact-box";
import validateToken from "../../utils/validate-token";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import {getPaymentStatus} from "../../utils/get-payment-status";

const PhoneInput = React.lazy(() =>
  import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);

class MobileMoneyPaymentProcess extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      order: "",
      errors: {},
      payment_id: "",
      payment_status: "",
      activeTab: 1,
      passedSteps: [1],
      modifiedSteps: [1],
      plans: [],
      plansFetched: false,
      selectedPlan: null,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.changePlan = this.changePlan.bind(this);
  }

  async componentDidMount() {
    const {setLoading} = this.context;
    const {cookies, orgSlug, setUserData, logout, setTitle, orgName, language, settings} =
      this.props;
    setLoading(true);

    let {userData} = this.props;
    const isValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    if (isValid) {
      ({userData} = this.props);
      const {phone_number} = userData;
      this.setState({phone_number});
    }

    setLoading(false);
    const plansUrl = plansApiUrl.replace("{orgSlug}", orgSlug);

    setTitle(t`REGISTRATION_TITL`, orgName);

    if (settings.subscriptions) {
      setLoading(true);
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": getLanguageHeaders(language),
        },
        url: plansUrl,
      })
        .then((response) => {
          this.setState({plans: response.data, plansFetched: true});

          setLoading(false);
        })
        .catch((error) => {
          toast.error(t`ERR_OCCUR`);
          logError(error, "Error while fetching plans");
        });
    }
    this.getCurrentUserPlan();
    this.autoSelectFirstPlan();
    // this.intervalId =setInterval(this.getPaymentStatus, 60000);
  }

  async getCurrentUserPlan() {
    const {setLoading} = this.context;
    const {cookies, orgSlug, setUserData, logout, setTitle, orgName, language, settings, userData} =
      this.props;
    const currentPlanUrl = currentPlanApiUrl(orgSlug);
    setLoading(true);
    axios({
      method: "get",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.auth_token}`,
      },
      url: currentPlanUrl,
    })
      .then((response) => {
        // this.setState({plans: response.data, plansFetched: true});

        setUserData({
          ...userData,
          active_order: response.data.active_order,
          plan: response.data.plan,
          active: response.data.active,
        });
        if (response.data.active_order) {
          this.setState({
            payment_id: response.data.active_order.payment_id,
          });
          if (response.data.active_order.payment_status === "waiting") {
            this.intervalId = setInterval(this.getPaymentStatus, 60000);
            this.toggleTab(3);
            toast.info("Getting payment status. Please wait");
          }


        }

        setLoading(false);
      })
      .catch((error) => {
        toast.error(t`ERR_OCCUR`);
        logError(error, "Error while getting current user plan");
      });
  }

  async componentDidUpdate(prevProps) {
    const {plans} = this.state;
    const {settings, loading} = this.props;
    const {setLoading} = this.context;
    if (
      settings.subscriptions &&
      plans.length === 0 &&
      loading === false &&
      prevProps.loading === true
    ) {
      setLoading(true);
    }
  }

  componentWillUnmount = () => {
    clearInterval(this.intervalId);
    window.removeEventListener("resize", this.updateScreenWidth);
  };

  getPaymentStatus = async () => {
    const {userData, orgSlug, setUserData, navigate} = this.props;
    const {setLoading} = this.context;
    const {payment_id, payment_status} = this.state;
    const {userplan} = userData;

    if (!payment_id) {
      return;
    }
    if (payment_status && payment_status === "success") {
      return;
    }

    const paymentStatus = await getPaymentStatus(orgSlug, payment_id, userData.auth_token);

    this.setState({
      "payment_status": paymentStatus,
    });
    switch (paymentStatus) {
      case "waiting":
        return;
      case "success":
        setUserData({
          ...userData,
          is_verified: true,
          payment_url: null,
          mustLogin: true,
        });
        toast.success("Payment was successfully");
        return navigate(`/${orgSlug}/payment/${paymentStatus}`);
      case "failed":
        setUserData({...userData, payment_url: null});
        toast.info("The payment failed");
        return navigate(`/${orgSlug}/payment/${paymentStatus}`);
      default:
        // Request failed
        toast.error(t`ERR_OCCUR`);
        setUserData({...userData, payment_url: null});
        return navigate(`/${orgSlug}/payment/failed`);
    }
    // navigate(redirectUrl);
  };

  getPlan = (plan, index) => {
    /* disable ttag */
    const planTitle = gettext(plan.plan);
    const planDesc = gettext(plan.plan_description);
    /* enable ttag */
    const pricingText = Number(plan.price)
      ? `${plan.price} ${plan.currency} ${plan.pricing}`
      : "";
    return (
      <label htmlFor={`radio${index}`}>
        <span className="title">{planTitle}</span>
        <span className="desc">{planDesc}</span>
        {pricingText && <span className="price">{pricingText}</span>}
      </label>
    );
  };

  changePlan = (event) => {
    this.setState({selectedPlan: event.target.value});
  };

  getPlanSelection = () => {
    const {userData} = this.props;
    const {plans, selectedPlan} = this.state;
    const {userplan} = userData;
    const auto_select_first_plan = false;

    let index = 0;
    return (
      <div className={`plans ${auto_select_first_plan ? "hidden" : ""}`}>
        <p className="intro">{t`PLAN_SETTING_TXT`}.</p>
        {plans.map((plan) => {
          const currentIndex = String(index);

          let planClass = "plan";
          if (userplan && userplan.active_order && selectedPlan === null && userplan.active_order && userplan.active_order.plan === plan.id) {
            this.changePlan({target: {value: currentIndex}});
          }
          if (selectedPlan === currentIndex) {
            planClass += " active";
          } else if (selectedPlan !== null && selectedPlan !== currentIndex) {
            planClass += " inactive";
          }
          index += 1;
          return (
            <div key={currentIndex} className={planClass}>
              <input
                id={`radio${currentIndex}`}
                type="radio"
                value={currentIndex}
                name="plan_selection"
                onChange={this.changePlan}
                onFocus={this.changePlan}
                tabIndex={currentIndex}
              />
              {this.getPlan(plan, currentIndex)}
            </div>
          );
        })}
      </div>
    );
  };

  autoSelectFirstPlan = () => {
    const {registration} = this.props;
    if (true) {
      this.changePlan({target: {value: 0}});
    }
  };


  isPlanIdentityVerifier = () => {
    // If a payment is required, the plan is valid for identity verification
    const {selectedPlan, plans} = this.state;
    return (
      selectedPlan !== null && plans[selectedPlan].requires_payment === true
    );
  };


  doesPlanRequireInvoice = () => {
    const {settings} = this.props;
    const {selectedPlan, plans} = this.state;
    return (
      settings.subscriptions &&
      selectedPlan !== null &&
      plans[selectedPlan].requires_invoice === true
    );
  };

  handleSubmit(event) {
    event.preventDefault();
    const {setLoading} = this.context;
    const {orgSlug, setUserData, userData, language, navigate} = this.props;
    const {method} = userData;
    const {phone_number, errors, plans, selectedPlan} = this.state;
    const url = buyPlanUrl(orgSlug);


    const data = {
      "phone_number": phone_number,
      "method": method,
    };
    console.log(method);

    if (method === "" || method === undefined || method === null) {
      data.method = "mpesa";
    }

    let plan_pricing;
    if (selectedPlan !== null) {
      plan_pricing = plans[selectedPlan];
      data.plan_pricing = plan_pricing.id;
      data.requires_payment = plan_pricing.requires_payment;
    }


    this.setState({errors: {...errors, phone_number: ""}});
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.auth_token}`,
      },
      url,
      data: qs.stringify(data),
    })
      .then(async (response) => {
        this.setState({
          errors: {},
        });

        // setUserData({...userData,phone_number,status: response.status,payment_id:response.data.payment.id,payment_status:response.data.payment.status});
        setUserData({...userData, phone_number, status: response.status, payment_id: response.data.payment.id});
        this.setState({
          payment_id: response.data.payment.id,
          payment_status: response.data.payment.status,
        });
        this.intervalId = setInterval(this.getPaymentStatus, 60000);
        setLoading(false);
        this.toggleTab(3);
        toast.info(response.data.payment.message);
        toast.info("You will receive an stp push on your phone");

        // navigate(`/${orgSlug}/mobile-phone-verification`);
      })
      .catch((error) => {
        const {data} = error.response;
        const errorText = getErrorText(error);
        if (errorText) {
          logError(error, errorText);
          toast.error(errorText);
        }
        setLoading(false);
        this.setState({
          errors: {
            ...errors,
            ...(data.phone_number ? {phone_number: data.phone_number} : null),
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
          },
        });
      });
  }

  handleChange(event) {
    handleChange(event, this);
  }

  toggleTab(tab) {
    const {activeTab, passedSteps} = this.state;

    if (activeTab !== tab) {
      var modifiedSteps = [...passedSteps, tab];

      if (tab >= 1 && tab <= 4) {
        this.setState({activeTab: tab, passedSteps: modifiedSteps});


      }
    }
  }

  renderWaitingForPayment() {
    const {userData, orgSlug} = this.props;
    const {phone_number, order} = userData;
    const {userplan} = userData;


    return (

      <div className="text-center py-5">

        <div className="mb-4">
          <lord-icon src="https://cdn.lordicon.com/lupuorrc.json" trigger="loop"
                     colors="primary:#25a0e2,secondary:#00bd9d"
                     style={{width: "120px", height: "120px"}}></lord-icon>
        </div>
        <h5>You payment is being processed</h5>
        <p className="text-muted">You will receive an notification on {phone_number} to pay your internet
          plan. You will automatically have internet access once payment is successful.</p>

        <h3 className="fw-semibold">Order
          ID: {(userplan && userplan.active_order ? userplan.active_order.id : "N/A")}<a
            className="text-decoration-underline"></a></h3>
        <div className="row cancel">
          <Link className="button full" to={`/`}>
            {t`CANCEL`}
          </Link>
        </div>
      </div>

    );
  }

  renderPaymentForm() {
    const {activeTab, modifiedSteps, passedSteps, errors, phone_number, plans} = this.state;
    const {orgSlug, mobile_money_payment_form, isAuthenticated, userData, settings} = this.props;
    const {userplan} = userData;
    const {input_fields} = mobile_money_payment_form;

    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <div className="row checkout-tab">

                <form
                  onSubmit={this.handleSubmit}
                  id="buy-plan-form"
                >
                  <div className="step-arrow-nav mt-n3 mx-n3 mb-3">

                    <ul className="nav nav-pills nav-justified custom-nav" role="tablist">
                      <li className="nav-item" role="presentation">
                        <button
                          className={classnames({
                            active: activeTab === 1,
                            done: (activeTab <= 4 && activeTab >= 0),
                          }, "nav-link fs-15 p-3 ")}
                          onClick={() => {
                            this.toggleTab(1);
                          }}
                          id="pills-bill-info-tab" data-bs-toggle="pill" data-bs-target="#pills-bill-info"
                          type="button"
                          role="tab" aria-controls="pills-bill-info" aria-selected="true" data-position="0"><i
                          className="ri-user-2-line fs-16 p-2 bg-primary-subtle text-primary rounded-circle align-middle me-2"></i>
                          Plans
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={classnames({
                            active: activeTab === 2,
                            done: activeTab <= 3 && activeTab > 1,
                          }, "nav-link fs-15 p-3")}
                          onClick={() => {
                            this.toggleTab(2);
                          }}
                          id="pills-payment-tab" data-bs-toggle="pill" data-bs-target="#pills-payment"
                          type="button"
                          role="tab" aria-controls="pills-payment" aria-selected="false" data-position="2"
                          tabIndex="-1"><i
                          className="ri-bank-card-line fs-16 p-2 bg-primary-subtle text-primary rounded-circle align-middle me-2"></i>
                          Payment Info
                        </button>
                      </li>
                      <li className="nav-item" role="presentation">
                        <button
                          className={classnames({
                            active: activeTab === 3,
                            done: activeTab <= 3 && activeTab > 2,
                          }, "nav-link fs-15 p-3")}
                          onClick={() => {
                            this.toggleTab(3);
                          }}
                          id="pills-finish-tab" data-bs-toggle="pill" data-bs-target="#pills-finish" type="button"
                          role="tab" aria-controls="pills-finish" aria-selected="false" data-position="3"
                          tabIndex="-1">
                          <i
                            className="ri-checkbox-circle-line fs-16 p-2 bg-primary-subtle text-primary rounded-circle align-middle me-2"></i>Finish
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div className="tab-content">
                    <div className={"tab-pane fade " + (activeTab === 1 ? "show active" : "")}
                         id="pills-bill-info" role="tabpanel" aria-labelledby="pills-bill-info-tab">
                      <div>
                        <h5 className="mb-1">Choose a plan</h5>
                        <p className="text-muted mb-4">Please fill all information below</p>
                      </div>

                      {plans.length > 0 && this.getPlanSelection()}
                    </div>

                    <div className={"tab-pane fade " + (activeTab === 2 ? "show active" : "")} id="pills-payment"
                         role="tabpanel" aria-labelledby="pills-payment-tab">
                      <div>
                        <h5 className="mb-1">Payment Selection</h5>
                        <p className="text-muted mb-4">Please select and enter your billing
                          information</p>
                      </div>

                      <div className="row g-4">
                        <div className="col-lg-4 col-sm-6">
                          <div data-bs-toggle="collapse" data-bs-target="#paymentmethodCollapse.show"
                               aria-expanded="false" aria-controls="paymentmethodCollapse">
                            <div className="form-check card-radio">
                              <input id="paymentMethod01" name="method" type="radio" className="form-check-input"
                                     checked={true}></input>
                              <label className="form-check-label" htmlFor="paymentMethod01">
                                      <span className="fs-16 text-muted me-2"><i
                                        className="ri-paypal-fill align-bottom"></i></span>
                                <span className="fs-14 text-wrap">Mpesa</span>
                              </label>
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="collapse show" id="paymentmethodCollapse">
                        <div className="card p-4 border shadow-none mb-0 mt-4">
                          <div className="row gy-3">


                            <div className="phone-number">
                              <label className="form-label" htmlFor="phone-number">{t`PHONE_LBL`}</label>
                              {getError(errors, "phone_number")}
                              <Suspense
                                fallback={
                                  <input
                                    name="phone_number"
                                    className="form-control input"
                                    value={phone_number}
                                    onChange={(value) =>
                                      this.handleChange({
                                        target: {name: "phone_number", value: `+${value}`},
                                      })
                                    }
                                    onKeyDown={(event) => {
                                      submitOnEnter(event, this, "mobile-phone-change-form");
                                    }}
                                    placeholder={t`PHONE_PHOLD`}
                                    id="phone-number"
                                  />
                                }
                              >
                                <PhoneInput
                                  name="phone_number"
                                  onlyCountries={
                                    input_fields.phone_number.only_countries || []
                                  }
                                  preferredCountries={
                                    input_fields.phone_number.preferred_countries || []
                                  }
                                  excludeCountries={
                                    input_fields.phone_number.exclude_countries || []
                                  }
                                  value={phone_number}
                                  onChange={(value) =>
                                    this.handleChange({
                                      target: {name: "phone_number", value: `+${value}`},
                                    })
                                  }
                                  onKeyDown={(event) => {
                                    submitOnEnter(event, this, "mobile-phone-change-form");
                                  }}
                                  placeholder={t`PHONE_PHOLD`}
                                  enableSearch={Boolean(
                                    input_fields.phone_number.enable_search,
                                  )}
                                  inputProps={{
                                    name: "phone_number",
                                    id: "phone-number",
                                    className: `form-control input ${
                                      errors.phone_number ? "error" : ""
                                    }`,
                                    required: true,
                                  }}
                                />
                              </Suspense>
                            </div>


                          </div>
                        </div>
                        <div className="text-muted mt-2 fst-italic">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                               fill="none"
                               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                               className="feather feather-lock text-muted icon-xs">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          Your
                          transaction is secured with SSL encryption
                        </div>
                      </div>

                      <div className="d-flex align-items-start gap-3 mt-4">


                      </div>
                      <div className="row submit">
                        <input
                          type="submit"
                          className="button full"
                          value={t`PAY_PROC_BTN`}
                        />
                      </div>

                      <div className="row cancel">
                        <Link className="button full" to={`/`}>
                          {t`CANCEL`}
                        </Link>
                      </div>
                    </div>

                    <div className={"tab-pane fade " + (activeTab === 3 ? "show active" : "")} id="pills-finish"
                         role="tabpanel" aria-labelledby="pills-finish-tab">
                      {this.renderWaitingForPayment()}
                    </div>

                  </div>

                </form>
              </div>


            </div>
          </div>
        </div>
      </div>

    );
  }

  render() {
    const {phone_number, errors} = this.state;
    const {orgSlug, mobile_money_payment_form, isAuthenticated, userData, settings} = this.props;

    const {input_fields} = mobile_money_payment_form;
    const {method, is_verified: isVerified, status} = userData;


    const redirectToStatus = () => <Navigate to={`/${orgSlug}/status`} />;
    const acceptedValues = ["success", "failed", "draft", "waiting"];
    // const acceptedValues = ["success", "failed", "draft"];
    const {isTokenValid} = this.state;

    // if (isVerified){
    //   return redirectToStatus();
    // }
    //
    // //not registered with bank card flow
    // if (
    //   (method && method !== "mpesa") ||
    //   isVerified === true
    // ) {
    //   return redirectToStatus();
    // }
    //
    // // likely somebody opening this page by mistake
    // if (isAuthenticated === false) {
    //   return redirectToStatus();
    // }
    //
    // // not registered with bank card flow
    // if (
    //   (method && !settings.payment_methods.includes(method)) ||
    //   !acceptedValues.includes(status)
    // ) {
    //   return redirectToStatus();
    // }

    // likely somebody opening this page by mistake
    // if (
    //   (isAuthenticated === false && status !== "draft") ||
    //   (["failed", "draft"].includes(status) && isVerified === true) ||
    //   (status === "success" && isVerified === false) ||
    //   isTokenValid === false
    // ) {
    //   return redirectToStatus();
    // }

    return this.renderPaymentForm();


    return (
      <div className="container content" id="mobile-phone-change">
        <div className="inner">
          {this.renderPaymentForm()}
          <Contact />
        </div>
      </div>
    );
  }
}

export default MobileMoneyPaymentProcess;
MobileMoneyPaymentProcess.contextType = LoadingContext;
MobileMoneyPaymentProcess.propTypes = {
  mobile_money_payment_form: PropTypes.shape({
    input_fields: PropTypes.shape({
      phone_number: PropTypes.shape({
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }).isRequired,
    }).isRequired,
    buttons: PropTypes.shape({
      change_phone_number: PropTypes.bool,
      cancel: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  navigate: PropTypes.func.isRequired,
};
