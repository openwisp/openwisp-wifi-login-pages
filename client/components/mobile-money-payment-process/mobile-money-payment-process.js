/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Cookies} from "react-cookie";
import {Link, Route, Routes} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {gettext, t} from "ttag";
import "react-phone-input-2/lib/style.css";
import ReactLoading from "react-loading";
import merge from "deepmerge";
import LoadingContext from "../../utils/loading-context";
import {buyPlanUrl, currentPlanApiUrl, paymentUrlWs, plansApiUrl, prefix} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import Contact from "../contact-box";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import {getPaymentStatus} from "../../utils/get-payment-status";
import Modal from "../modal";
import ReconnectingWebSocket from "../../utils/websocker_helper";
import defaultConfig from "../../../server/utils/default-config";
import config from "../../../server/config.json";
import handleLogout from "../../utils/handle-logout";


const PhoneInput = React.lazy(() =>
  import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);

class MobileMoneyPaymentProcess extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      email: "",
      first_name: "",
      last_name: "",
      location: "",
      order: "",
      voucher_code: "",
      errors: {},
      payment_id: null,
      ws_token: null,
      payment_status: null,
      activeTab: 1,
      passedSteps: [1],
      modifiedSteps: [1],
      plans: [],
      plansFetched: false,
      selectedPlan: {},
      modalActive: false,
      tax_number: "",
      street: "",
      city: "",
      zipcode: "",
      country: "",
      countrySelected: {},
      messageHistory: [],
      readyState: null,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.changePlan = this.changePlan.bind(this);
    this.webSocket = null;

  }

  async componentDidMount() {
    const {setLoading} = this.context;
    const {cookies, orgSlug, setUserData, logout, setTitle, orgName, language, settings} =
      this.props;
    setLoading(true);


    const {userData} = this.props;


    setLoading(false);
    const plansUrl = plansApiUrl.replace("{orgSlug}", orgSlug);

    setTitle("Buy internet plans", orgName);

    const {phone_number} = userData;

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
          this.setState({plans: response.data, plansFetched: true, phone_number});

          setLoading(false);
        })
        .catch((error) => {
          toast.error(t`ERR_OCCUR`);
          logError(error, "Error while fetching plans");
        });
    }
    this.getCurrentUserPlan();
    this.autoSelectFirstPlan();
    const {payment_id} = this.state;
    if (payment_id && !this.webSocket) {
      this.getPaymentStatusWs();
    }

  }

  handleLoginUserAfterOrderSuccess(username, auth_token) {
    const {cookies, orgSlug, setUserData, userData, logout, setTitle, orgName, language, settings} =
      this.props;

    cookies.set(`${orgSlug}_auth_token`, auth_token, {path: "/"});
    cookies.set(`${orgSlug}_username`, username, {path: "/"});
    setUserData({
      ...userData,
      username,
      auth_token,
      is_verified: false,

    });
  }


  getPaymentStatusWs = () => {
    const {userData, orgSlug, orgHost, setUserData, navigate} = this.props;
    const {setLoading} = this.context;
    const {payment_id, payment_statu, ws_token} = this.state;
    const {userplan} = userData;

    const validSlug = config.some((org) => {
      if (org.slug === orgSlug) {
        // merge default config and custom config
        const conf = merge(defaultConfig, org);
        const {dashboard_host} = conf;
        const url = `${dashboard_host.replace("http", "ws")}${paymentUrlWs(orgSlug, payment_id).replace(prefix, "/ws/payments/organization")}?token=${ws_token || userData.auth_token}`;

        this.webSocket = new ReconnectingWebSocket(url, []);

        this.webSocket.onopen = () => {

          this.setState({readyState: this.webSocket.readyState});
        };
        this.webSocket.onmessage = (event) => {
          const payment_data = JSON.parse(event.data);
          const payment_status = payment_data.status;

          if (payment_status === "success") {
            this.handleLoginUserAfterOrderSuccess(payment_data.username, payment_data.key);
          }

          this.handlePaymentStatusChange(payment_status);

        };

        this.webSocket.onerror = (error) => {
          toast.error(error.toString());
        };

        this.webSocket.onclose = () => {
          this.setState({readyState: this.webSocket.readyState});
        };

      }
      return org.slug === orgSlug;
    });

    if (!validSlug) {
      toast.error("Invalid organization");
  }


  };


  async getCurrentUserPlan() {
    const {setLoading} = this.context;
    const {cookies, orgSlug, setUserData, logout, setTitle, orgName, language, settings, userData} =
      this.props;
    const currentPlanUrl = currentPlanApiUrl(orgSlug);
    setLoading(true);
    const headers_data = {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.auth_token}`,
    };
    if (userData.auth_token === undefined) {
      delete headers_data.Authorization;
    }

    axios({
      method: "get",
      headers: headers_data,
      url: currentPlanUrl,
      withCredentials: true,
      params: {
        "get-token": "1",
      },
    })
      .then((response) => {

        setUserData({
          ...userData,
          userplan: response.data,
        });
        if (response.data.active_order) {
          this.setState({
            payment_id: response.data.active_order.payment_id,
          });
          if (response.data.active_order.payment_status === "waiting") {

            this.intervalId = setInterval(this.getPaymentStatus, 60000);
          }


        }

        setLoading(false);
      })
      .catch((error) => {

        const {response} = error;
        const excludeErrorMessageStatus = [401, 403];
        if (!excludeErrorMessageStatus.includes(response.status)) {
          toast.error(t`ERR_OCCUR`);
        }
        setLoading(false);

        logError(error, "Error while getting current user plan");
      });
  }

  async componentDidUpdate(prevProps) {
    const {plans, payment_id} = this.state;
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
    if (payment_id && !this.webSocket) {
      this.getPaymentStatusWs();
    }

  }

  toggleModal = () => {
    const {modalActive} = this.state;
    this.setState({modalActive: !modalActive});
  };

  componentWillUnmount = () => {
    clearInterval(this.intervalId);
    window.removeEventListener("resize", this.updateScreenWidth);
    if (this.webSocket) {
      this.webSocket.close();
    }
  };

  handlePaymentStatusChange = async (paymentStatus) => {

    const {userData, orgSlug, setUserData, navigate} = this.props;

    if (paymentStatus) {
      this.setState({
      "payment_status": paymentStatus,
    });
    } else {
      return;
    }



    switch (paymentStatus) {
      case "waiting":
        return;
      case "pending":
        return;
      case "success":
        await this.getCurrentUserPlan();
        setUserData({
          ...userData,
          is_verified: true,
          payment_url: null,

        });
        toast.success("Payment was successfully");
        this.setState({payment_id: null, payment_status: null});
        clearInterval(this.intervalId);
        if (this.webSocket) {
          this.webSocket.close();
        }
        navigate(`/${orgSlug}/payment/${paymentStatus}`);
        return;
      case "failed":
        await this.getCurrentUserPlan();
        setUserData({...userData, payment_url: null});
        toast.info("The payment failed");
        this.setState({payment_id: null, payment_status: null});
        clearInterval(this.intervalId);
        if (this.webSocket) {
          this.webSocket.close();
        }
        navigate(`/${orgSlug}/payment/${paymentStatus}`);

      default:
        return;
      // Request failed
      // toast.error(t`ERR_OCCUR`);
      // setUserData({...userData, payment_url: null});
      // this.setState({payment_id: null});
      // clearInterval(this.intervalId);
      // navigate(`/${orgSlug}/payment/failed`);

    }
  };

  getPaymentStatus = async () => {
    const {userData, orgSlug, setUserData, navigate} = this.props;
    const {setLoading} = this.context;
    const {payment_id, payment_status, ws_token} = this.state;
    const {userplan} = userData;

    if (!payment_id) {
      return;
    }
    if (payment_status && payment_status === "success") {
      return;
    }


    const paymentStatus = await getPaymentStatus(orgSlug, payment_id, userData.auth_token, ws_token);

    this.handlePaymentStatusChange(paymentStatus);

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
    const {mobile_money_payment_form} = this.props;
    const {plans, selectedPlan} = this.state;
    const {auto_select_first_plan} = mobile_money_payment_form;
    let index = 0;
    return (
      <div className={`plans ${auto_select_first_plan ? "hidden" : ""}`}>
        <p className="intro">{t`PLAN_SETTING_TXT`}.</p>
        {plans.map((plan) => {
          const currentIndex = String(index);
          let planClass = "plan";
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
    const {mobile_money_payment_form} = this.props;
    if (mobile_money_payment_form.auto_select_first_plan) {
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

  getForm = () => {
    const {mobile_money_payment_form, settings, orgSlug} = this.props;
    const {additional_info_text, input_fields, links} = mobile_money_payment_form;
    const {
      success,
      errors,
      selectedPlan,
      plans,
      voucher_code,
      tax_number,
      street,
      city,
      zipcode,
      countrySelected,
      hidePassword,
    } = this.state;

    const {userData} = this.props;

    const {phone_number} = userData;

    return (
      <>
        <div className="container content" id="registration">
          <div className="inner">
            <form
              className={`main-column ${success ? "success" : ""}`}
              onSubmit={this.handleSubmit}
              id="registration-form"
            >
              <div className="inner">
                <div className="fieldset">
                  {getError(errors)}
                  {plans.length > 0 && this.getPlanSelection()}
                  {(plans.length === 0 ||
                    (plans.length > 0 && selectedPlan !== null)) && (
                    <>
                      {
                        settings.mobile_phone_verification &&
                        input_fields.phone_number && (
                          <div className="row phone-number">
                            <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
                            {getError(errors, "phone_number")}
                            <Suspense
                              fallback={
                                <input
                                  type="tel"
                                  className="input"
                                  name="phone_number"
                                  value={phone_number}
                                  onChange={(value) =>
                                    this.handleChange({
                                      target: {
                                        name: "phone_number",
                                        value: `+${value}`,
                                      },
                                    })
                                  }
                                  onKeyDown={(event) => {
                                    submitOnEnter(
                                      event,
                                      this,
                                      "registration-form",
                                    );
                                  }}
                                  placeholder={t`PHONE_PHOLD`}
                                />
                              }
                            >
                              <PhoneInput
                                name="phone_number"
                                country={input_fields.phone_number.country}
                                onlyCountries={
                                  input_fields.phone_number.only_countries || []
                                }
                                preferredCountries={
                                  input_fields.phone_number
                                    .preferred_countries || []
                                }
                                excludeCountries={
                                  input_fields.phone_number.exclude_countries ||
                                  []
                                }
                                value={phone_number}
                                onChange={(value) =>
                                  this.handleChange({
                                    target: {
                                      name: "phone_number",
                                      value: `+${value}`,
                                    },
                                  })
                                }
                                onKeyDown={(event) => {
                                  submitOnEnter(
                                    event,
                                    this,
                                    "registration-form",
                                  );
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
                                  autoComplete: "tel",
                                }}
                              />
                            </Suspense>
                          </div>
                        )}

                      <div className="row voucher_code">
                        <label htmlFor="firsvoucher_codet_name">
                          Voucher Code {`(${t`OPTIONAL`})`}
                        </label>
                        {getError(errors, "voucher_code")}
                        <input
                          className={`input ${
                            errors.voucher_code ? "error" : ""
                          }`}
                          type="text"
                          id="voucher_code"

                          name="voucher_code"
                          value={voucher_code}
                          onChange={this.handleChange}
                          autoComplete="given-name"
                          placeholder="Enter voucher code"
                        />
                      </div>

                    </>
                  )}
                </div>

                {(plans.length === 0 ||
                    (plans.length > 0 && selectedPlan !== null)) &&
                  additional_info_text && (
                    <div className="row add-info">
                      <h5>Buy internet plans</h5>
                    </div>
                  )}

                <div className="row register">
                  {(plans.length === 0 ||
                    (plans.length > 0 && selectedPlan !== null)) && (
                    <input
                      type="submit"
                      className="button full"
                      value="Buy Plan"
                    />
                  )}
                </div>
                <div className="row cancel">

                  <Link className="button full" to="/">
                    {t`CANCEL`}
                  </Link>
                </div>

                {links && (
                  <div className="row links">
                    {links.forget_password && (
                      <p>
                        <Link
                          to={`/${orgSlug}/password/reset`}
                          className="link"
                        >
                          {t`FORGOT_PASSWORD`}
                        </Link>
                      </p>
                    )}
                    {links.login && (
                      <p>
                        <Link to={`/${orgSlug}/login`} className="link">
                          {t`LINKS_LOGIN_TXT`}
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </form>

            <Contact />
          </div>
        </div>
        <Routes>
          <Route
            path=":name"
            element={<Modal prevPath={`/${orgSlug}/registration`} />}
          />
        </Routes>
      </>
    );
  };

  logout = () => {
    const {logout, cookies, orgSlug, setUserData, userData, navigate} =
      this.props;
    const redirectToStatus = (statusUrl = `/${orgSlug}/status`) =>
      navigate(statusUrl);
    handleLogout(
      logout,
      cookies,
      orgSlug,
      setUserData,
      userData,
      false,
      redirectToStatus,
    );
  };



  handleSubmit(event) {
    event.preventDefault();
    const {setLoading} = this.context;
    const {orgSlug, setUserData, userData, language, navigate} = this.props;
    const {method} = userData;
    const {phone_number, voucher_code, errors, plans, selectedPlan} = this.state;
    const url = buyPlanUrl(orgSlug);


    const data = {
      "phone_number": phone_number,
      "method": method,
      "voucher": voucher_code,
    };

    if (method === "" || method === undefined || method === null) {
      data.method = "mpesa";
    }

    let plan_pricing;

    if (selectedPlan !== null) {

      plan_pricing = plans[selectedPlan];
      if (plan_pricing) {
        data.plan_pricing = plan_pricing.id;
        data.requires_payment = plan_pricing.requires_payment;
      }

    }


    this.setState({errors: {...errors, phone_number: ""}});
    setLoading(true);

    const {auth_token} = userData;

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

        if (auth_token === undefined) {
          this.setState({
            ws_token: response.data.ws_token,
          });
        } else {
          this.setState({
            ws_token: auth_token,
          });
        }
        if (response && response.data && response.data.payment && response.data.payment.status === "success") {
          this.handleLoginUserAfterOrderSuccess(response.data.username, response.data.key);
          await this.handlePaymentStatusChange(response.data.payment.status);
          return;
        }

        // setUserData({...userData,phone_number,status: response.status,payment_id:response.data.payment.id,payment_status:response.data.payment.status});
        setUserData({...userData, phone_number, payment_id: response.data.payment.id});
        this.setState({
          payment_id: response.data.payment.id,
          payment_status: response.data.payment.status,
        });
        this.getPaymentStatusWs();
        this.intervalId = setInterval(this.getPaymentStatus, 60000);
        setLoading(false);
        this.toggleTab(3);
        toast.info(response.data.payment.message);

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
            ...(data.voucher ? {voucher_code: data.voucher} : null),
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
      const modifiedSteps = [...passedSteps, tab];

      if (tab >= 1 && tab <= 4) {
        this.setState({activeTab: tab, passedSteps: modifiedSteps});


      }
    }
  }

  renderWaitingPayment() {
    return (
      <>
        <div className="container content" id="registration">

          <div className="inner payment-content">
            <div className="row full">
              <ReactLoading type="cylon" color="black" height="20%" width="20%"
                            className="processing-payment-loader" />
              <h4>Processing Payment .....</h4>
              <p>Your mpesa payment is being processed. You should get an stk push on your phone number. Please enter
                your mpesa pin and click confirm</p>


              <div className="row cancel">
                <Link className="button full" to="/">
                  {t`CANCEL`}
                </Link>
              </div>
            </div>

            <Contact />
          </div>
        </div>

      </>
    );
  }

  handBuyPlanAgain() {
    const {navigate, orgSlug} = this.props;
    this.setState({payment_status: null});
    navigate(`/${orgSlug}/payment/mobile-money/process`);

  }

  renderCheckPaymentStatus() {
    const {orgSlug} = this.props;
    return (
      <>
        <div className="container content" id="registration">

          <div className="inner payment-content">
            <div className="row full">
              <ReactLoading type="cylon" color="black" height="20%" width="20%"
                            className="processing-payment-loader" />
              <h4>Verifying Payment .....</h4>
              <p>Your mpesa payment is being verified. Your payment is being confirmed. Please wait....</p>

              <div className="row register">
                <button
                  onClick={this.handBuyPlanAgain}
                  className="button full"
                >Payment Again
                </button>
              </div>
              <div className="row cancel">
                <Link className="button full" to="/">
                  {t`CANCEL`}
                </Link>
              </div>
            </div>

            <Contact />
          </div>
        </div>

      </>
    );
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
                     style={{width: "120px", height: "120px"}} />
        </div>
        <h5>You payment is being processed</h5>
        <p className="text-muted">You will receive an notification on {phone_number} to pay your internet
          plan. You will automatically have internet access once payment is successful.</p>

        <h3 className="fw-semibold">Order
          ID: {(userplan && userplan.active_order ? userplan.active_order.id : "N/A")}<a
            className="text-decoration-underline" /></h3>
        <div className="row cancel">
          <Link className="button full" to="/">
            {t`CANCEL`}
          </Link>
        </div>
      </div>

    );
  }


  render() {

    const {orgSlug, isAuthenticated, userData, settings, navigate} = this.props;

    const {plansFetched, modalActive, errors, payment_status} = this.state;
    const redirectToStatus = () => navigate(`/${orgSlug}/status`);
    const {auth_token} = userData;

    if (settings.subscriptions && !plansFetched) {
      return null;
    }


    if (payment_status === "pending") {
      return this.renderWaitingPayment();
    }

    if (payment_status === "waiting") {
      return this.renderCheckPaymentStatus();
    }



    // likely somebody opening this page by mistake
    // if (isAuthenticated === false) {
    //   redirectToStatus();
    // }
    //
    // if (!auth_token) {
    //   redirectToStatus();
    // }

    return (

      <>
        {this.getForm()}</>
    );
  }
}

export default MobileMoneyPaymentProcess;
MobileMoneyPaymentProcess.contextType = LoadingContext;
MobileMoneyPaymentProcess.propTypes = {
  mobile_money_payment_form: PropTypes.shape({
    input_fields: PropTypes.shape({
      phone_number: PropTypes.shape({
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      first_name: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      last_name: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      voucher_code: PropTypes.shape({
        setting: PropTypes.string,
      }),
      location: PropTypes.shape({
        setting: PropTypes.string.isRequired,
        pattern: PropTypes.string.isRequired,
      }),
      birth_date: PropTypes.shape({
        setting: PropTypes.string.isRequired,
      }),
      country: PropTypes.shape({
        pattern: PropTypes.string,
      }),
      zipcode: PropTypes.shape({}),
      city: PropTypes.shape({}),
      street: PropTypes.shape({}),
      tax_number: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    buttons: PropTypes.shape({
      change_phone_number: PropTypes.bool,
      cancel: PropTypes.bool,
    }).isRequired,
    additional_info_text: PropTypes.bool,
    links: PropTypes.object,
    auto_select_first_plan: PropTypes.bool,
  }).isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
  logout: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  navigate: PropTypes.func.isRequired,
};
