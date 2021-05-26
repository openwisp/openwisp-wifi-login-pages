/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingContext from "../../utils/loading-context";

import {
  createMobilePhoneTokenUrl,
  logoutSuccess,
  verifyMobilePhoneTokenUrl,
} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";
import handleSession from "../../utils/session";
import validateToken from "../../utils/validateToken";

export default class MobilePhoneVerification extends React.Component {
  phoneTokenSentKey = "owPhoneTokenSent";

  constructor(props) {
    super(props);
    this.state = {
      code: "",
      phone_number: "",
      errors: {},
      success: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.resendPhoneToken = this.resendPhoneToken.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  async componentDidMount() {
    const {
      cookies,
      orgSlug,
      verifyMobileNumber,
      settings,
      setIsActive,
      setUserData,
      logout,
    } = this.props;
    let {userData} = this.props;
    const {setLoading} = this.context;
    setLoading(true);
    const isValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    if (isValid) {
      ({userData} = this.props);
      const {phone_number, is_verified, is_active} = userData;
      this.setState({phone_number});
      verifyMobileNumber(!is_verified && settings.mobile_phone_verification);
      setIsActive(is_active);
      // send token via SMS only if user needs to verify
      if (!is_verified && settings.mobile_phone_verification) {
        await this.createPhoneToken();
      }
    }
    setLoading(false);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {
      orgSlug,
      verifyMobileNumber,
      cookies,
      setIsActive,
      setUserData,
    } = this.props;
    const {code, errors} = this.state;
    this.setState({errors: {...errors, code: ""}});
    const url = verifyMobilePhoneTokenUrl(orgSlug);
    const auth_token = cookies.get(`${orgSlug}_auth_token`);
    const {token, session} = handleSession(orgSlug, auth_token, cookies);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        code,
        token,
        session,
      }),
    })
      .then(() => {
        this.setState({
          errors: {},
        });
        // to validate User in the status page
        setUserData({});
        setLoading(false);
        verifyMobileNumber(false);
        setIsActive(true);
      })
      .catch((error) => {
        const {data} = error.response;
        const errorText = getErrorText(error);
        logError(error, errorText);
        toast.error(errorText);
        setLoading(false);
        this.setState({
          errors: {
            ...errors,
            ...(data.code ? {code: data.code} : null),
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
          },
        });
      });
  }

  hasPhoneTokenBeenSent() {
    return sessionStorage.getItem(this.phoneTokenSentKey) !== null;
  }

  async createPhoneToken(resend = false) {
    // do not send new SMS token if one has already been sent
    if (!resend && this.hasPhoneTokenBeenSent()) {
      return false;
    }
    const {orgSlug, mobile_phone_verification, language} = this.props;
    const {errors, phone_number} = this.state;
    const {text} = mobile_phone_verification;
    const self = this;
    const url = createMobilePhoneTokenUrl(orgSlug);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        phone_number,
      }),
    })
      .then(() => {
        // flag SMS as sent to avoid resending it
        sessionStorage.setItem(self.phoneTokenSentKey, true);
        toast.info(getText(text.token_sent, language));
      })
      .catch((error) => {
        const errorText = getErrorText(error);
        logError(error, errorText);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
          },
        });
      });
  }

  async handleLogout() {
    const {orgSlug, logout, cookies} = this.props;
    logout(cookies, orgSlug);
    toast.success(logoutSuccess);
  }

  async resendPhoneToken() {
    const {setLoading} = this.context;
    setLoading(true);
    await this.createPhoneToken(true);
    setLoading(false);
  }

  render() {
    const {code, errors, success, phone_number} = this.state;
    const {orgSlug, language, mobile_phone_verification} = this.props;
    const {input_fields, buttons, text} = mobile_phone_verification;
    return (
      <div className="container content" id="mobile-phone-verification">
        <div className="inner">
          <div className="main-column">
            <form
              className={`${success ? "success" : ""}`}
              onSubmit={this.handleSubmit}
            >
              <div className="row fieldset code">
                <p className="label">
                  {getText(text.verify, language).replace(
                    "{phone_number}",
                    phone_number,
                  )}
                </p>

                {errors.nonField && (
                  <div className="error non-field">
                    <span className="icon">!</span>
                    <span className="text">{errors.nonField}</span>
                  </div>
                )}

                <div className="row">
                  {errors.code && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text">{errors.code}</span>
                    </div>
                  )}
                  <input
                    className={`input ${
                      errors.code || errors.nonField ? "error" : ""
                    }`}
                    type={input_fields.code.type}
                    id="code"
                    required
                    name="code"
                    value={code}
                    onChange={this.handleChange}
                    placeholder={getText(
                      input_fields.code.placeholder,
                      language,
                    )}
                    pattern={input_fields.code.pattern}
                    title={getText(
                      input_fields.code.pattern_description,
                      language,
                    )}
                  />
                </div>

                <button type="submit" className="button full">
                  {getText(buttons.verify, language)}
                </button>
              </div>
            </form>

            <div className="row fieldset resend">
              <p className="label">{getText(text.resend, language)}</p>

              <button
                type="button"
                className="button full"
                onClick={this.resendPhoneToken}
              >
                {getText(buttons.resend, language)}
              </button>
            </div>

            <div className="row fieldset change">
              <p className="label">{getText(text.change, language)}</p>
              <a
                href={`/${orgSlug}/change-phone-number`}
                className="button full"
              >
                {getText(buttons.change, language)}
              </a>
            </div>

            <div className="row fieldset logout">
              <p className="label">{getText(text.logout, language)}</p>
              <button
                type="button"
                className="button full"
                onClick={this.handleLogout}
              >
                {getText(buttons.logout, language)}
              </button>
            </div>
          </div>
          <Contact />
        </div>
      </div>
    );
  }
}
MobilePhoneVerification.contextType = LoadingContext;
MobilePhoneVerification.propTypes = {
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  mobile_phone_verification: PropTypes.shape({
    text: PropTypes.shape({
      verify: PropTypes.shape().isRequired,
      resend: PropTypes.shape().isRequired,
      change: PropTypes.shape().isRequired,
      token_sent: PropTypes.shape().isRequired,
      logout: PropTypes.shape().isRequired,
    }).isRequired,
    input_fields: PropTypes.shape({
      code: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.shape().isRequired,
        placeholder: PropTypes.shape().isRequired,
        label: PropTypes.shape().isRequired,
      }).isRequired,
    }).isRequired,
    buttons: PropTypes.shape({
      verify: PropTypes.shape().isRequired,
      resend: PropTypes.shape().isRequired,
      change: PropTypes.shape().isRequired,
      logout: PropTypes.shape().isRequired,
    }).isRequired,
  }).isRequired,
  verifyMobileNumber: PropTypes.func.isRequired,
  setIsActive: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
};
