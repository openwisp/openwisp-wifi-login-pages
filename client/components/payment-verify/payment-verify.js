/* eslint-disable camelcase */
import "./index.css";
import Countdown from "react-countdown";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import {t} from "ttag";
import "react-toastify/dist/ReactToastify.css";
import LoadingContext from "../../utils/loading-context";

import {mobilePhoneTokenStatusUrl, verifyPaymentIdUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";
import handleLogout from "../../utils/handle-logout";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import {sessionStorage} from "../../utils/storage";
import submitOnEnter from "../../utils/submit-on-enter";

const PhoneInput = React.lazy(() =>
  import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);

export default class PaymentCodeVerification extends React.Component {
  phoneTokenSentKey = "owPhoneTokenSent";

  constructor(props) {
    super(props);
    this.state = {
      payment_id: "",
      phone_number: "",
      errors: {},
      success: false,
      resendButtonDisabledCooldown: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.resendPhoneToken = this.resendPhoneToken.bind(this);
  }

  async componentDidMount() {
    const {
      cookies,
      orgSlug,
      settings,
      setUserData,
      logout,
      orgName,
      setTitle,
      language,
    } = this.props;
    setTitle(t`PAYMENT_VERIFY_TITL`, orgName);
    const {userData} = this.props;
    const {setLoading} = this.context;
    setLoading(true);

    setLoading(false);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    setLoading(true);
    event.preventDefault();
    const {orgSlug, setUserData, userData, language} = this.props;
    const {payment_id, phone_number, errors} = this.state;
    this.setState({errors: {...errors, code: ""}});
    const url = verifyPaymentIdUrl(orgSlug);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
      },
      url,
      data: qs.stringify({
        payment_id,
        phone_number,
      }),
    })
      .then((response) => {
        this.setState({
          errors: {},
        });
        console.log(response);
        // setUserData({
        //   ...userData,
        //   is_active: true,
        //   is_verified: true,
        //   mustLogin: true,
        //   username: userData.phone_number,
        // });
      })
      .catch((error) => {
        const {data} = error.response;
        const errorText = getErrorText(error, "Please Fix the errors below");
        logError(error, errorText);
        toast.error(errorText);
        setLoading(false);
        this.setState({
          errors: {
            ...errors,
            ...(data.code ? {code: data.code} : null),
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
            ...(data.account ? {phone_number: data.account} : null),
            ...(data.payment_id ? {payment_id: data.payment_id} : null),
          },
        });
      });
  }

  hasPhoneTokenBeenSent() {
    return sessionStorage.getItem(this.phoneTokenSentKey) !== null;
  }

  async activePhoneToken() {
    const {orgSlug, language, userData} = this.props;
    const url = mobilePhoneTokenStatusUrl(orgSlug);
    return axios({
      method: "get",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.auth_token}`,
      },
      url,
    })
      .then((data) => data.active)
      .catch((error) => {
        if (
          error.response &&
          error.response.status === 404 &&
          error.response.data &&
          error.response.data.response_code !== "INVALID_ORGANIZATION"
        ) {
          // This is kept for backward compatibility with older versions of OpenWISP RADIUS
          // that does not have API endpoint for checking phone token status.
          return false;
        }
        const errorText = getErrorText(error);
        logError(error, errorText);
        toast.error(errorText);
        return errorText;
      });
  }

  async resendPhoneToken() {
    const {setLoading} = this.context;
    setLoading(true);
    await this.createPhoneToken(true);
    // reset error messages
    this.setState({
      errors: {},
      code: "",
    });
    setLoading(false);
  }

  render() {
    const {payment_id, errors, success, phone_number, resendButtonDisabledCooldown} =
      this.state;
    console.log(errors);
    const {
      orgSlug,
      payment_verify_form,
      logout,
      cookies,
      setUserData,
      userData,
    } = this.props;
    const {input_fields} = payment_verify_form;

    return (
      <div className="container content" id="mobile-phone-verification">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <form
                className={`${success ? "success" : ""}`}
                onSubmit={this.handleSubmit}
              >
                {getError(errors)}

                <div className="row fieldset phone-number">
                  <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
                  {getError(errors, "account")}
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
                <div className="row fieldset payment_id">
                  <p className="label">{t`VERIFY_PAYMENT (${phone_number})`}</p>

                  <div className="row">
                    <label htmlFor="phone-number">M-Pesa Transaction Code</label>
                    {getError(errors, "payment_id")}
                    <input
                      className={`input ${
                        errors.payment_id || errors.nonField ? "error" : ""
                      }`}
                      type="text"
                      id="payment_id"
                      required
                      name="payment_id"
                      value={payment_id}
                      onChange={this.handleChange}
                      placeholder={t`PAYMENT_ID_PHOLD`}
                      title={t`MOBILE_CODE_TITL`}
                    />
                  </div>

                  <button type="submit" className="button full">
                    {t`MOBILE_PHONE_VERIFY`}
                  </button>
                </div>
              </form>

              <div className="row fieldset resend">
                <p className="label">
                  {resendButtonDisabledCooldown === 0 ? (
                    t`RESEND_TOKEN_LBL`
                  ) : (
                    <Countdown
                      date={Date.now() + resendButtonDisabledCooldown * 1000}
                      renderer={({seconds}) =>
                        t`RESEND_TOKEN_WAIT_LBL${seconds}`
                      }
                      onComplete={() =>
                        this.setState({resendButtonDisabledCooldown: 0})
                      }
                    />
                  )}
                </p>

                <button
                  type="button"
                  className="button full"
                  onClick={this.resendPhoneToken}
                  disabled={Boolean(resendButtonDisabledCooldown)}
                >
                  {t`RESEND_TOKEN`}
                </button>
              </div>

              <div className="row fieldset change">
                <p className="label">{t`PHONE_CHANGE_LBL`}</p>
                <a
                  href={`/${orgSlug}/change-phone-number`}
                  className="button full"
                >
                  {t`PHONE_CHANGE_BTN`}
                </a>
              </div>

              <div className="row fieldset logout">
                <p className="label">{t`LOGOUT_LBL`}</p>
                <button
                  type="button"
                  className="button full"
                  onClick={() =>
                    handleLogout(
                      logout,
                      cookies,
                      orgSlug,
                      setUserData,
                      userData,
                      true,
                    )
                  }
                >
                  {t`LOGOUT`}
                </button>
              </div>
            </div>
          </div>
          <Contact />
        </div>
      </div>
    );
  }
}
PaymentCodeVerification.contextType = LoadingContext;
PaymentCodeVerification.propTypes = {
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  payment_verify_form: PropTypes.shape({
    input_fields: PropTypes.shape({
      payment_id: PropTypes.shape({}),
      phone_number: PropTypes.shape({
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
};
