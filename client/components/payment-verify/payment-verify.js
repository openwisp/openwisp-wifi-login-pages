/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import {t} from "ttag";
import "react-toastify/dist/ReactToastify.css";
import {Link} from "react-router-dom";
import LoadingContext from "../../utils/loading-context";

import {mobilePhoneTokenStatusUrl, verifyPaymentIdUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";

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
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.resendPhoneToken = this.resendPhoneToken.bind(this);
  }

  async componentDidMount() {
    const {
      orgName,
      setTitle,
    } = this.props;
    setTitle(t`PAYMENT_VERIFY_TITL`, orgName);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    setLoading(true);
    event.preventDefault();
    const {orgSlug, navigate, userData, language} = this.props;
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
        setLoading(false);
        toast.success("Payment Code verified successfully");
        if (
          !userData.auth_token || !userData.radius_user_token
        ) {
          this.handleLoginUserAfterOrderSuccess(response.data.username, response.data.key);
        }
        navigate(`/${orgSlug}/status`);
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

  handleLoginUserAfterOrderSuccess(username, auth_token) {
    const {cookies, orgSlug, setUserData, userData, authenticate} =
      this.props;

    cookies.set(`${orgSlug}_auth_token`, auth_token, {path: "/"});
    cookies.set(`${orgSlug}_username`, username, {path: "/"});
    setUserData({
      ...userData,
      username,
      auth_token,
      is_verified: false,
      method: "mpesa",
      is_active: true,

    });
    authenticate(true);

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
    });
    setLoading(false);
  }

  render() {
    const {payment_id, errors, success, phone_number} =
      this.state;

    const {
      orgSlug,
      payment_verify_form,
      userData,
    } = this.props;
    const {input_fields, links} = payment_verify_form;

    if (!phone_number && userData.phone_number) {
      this.setState({phone_number: userData.phone_number});
    }

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
                    {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                    <label htmlFor="payment_id">M-Pesa Transaction Code</label>
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

              <div className="row fieldset change">
                <p className="label">{t`PHONE_CHANGE_LBL`} Buy new plan</p>
                <a
                  href={`/${orgSlug}/buy-plan`}
                  className="button full"
                >Buy Plan</a>
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
  authenticate: PropTypes.func.isRequired,
  payment_verify_form: PropTypes.shape({
    links: PropTypes.object,
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
  navigate: PropTypes.func.isRequired,
};
