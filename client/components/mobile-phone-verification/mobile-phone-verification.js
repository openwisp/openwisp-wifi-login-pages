import "./index.css";
import Countdown from "react-countdown";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Cookies} from "react-cookie";
import {toast} from "react-toastify";
import {t} from "ttag";
import "react-toastify/dist/ReactToastify.css";
import LoadingContext from "../../utils/loading-context";

import {
  createMobilePhoneTokenUrl,
  verifyMobilePhoneTokenUrl,
  mobilePhoneTokenStatusUrl,
} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";
import validateToken from "../../utils/validate-token";
import handleLogout from "../../utils/handle-logout";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";
import {sessionStorage} from "../../utils/storage";

export default class MobilePhoneVerification extends React.Component {
  phoneTokenSentKey = "owPhoneTokenSent";

  constructor(props) {
    super(props);
    this.state = {
      code: "",
      phoneNumber: "",
      errors: {},
      success: false,
      resendButtonDisabledCooldown: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.resendPhoneToken = this.resendPhoneToken.bind(this);
    this.componentIsMounted = false;
  }

  async componentDidMount() {
    this.componentIsMounted = true;
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
    setTitle(t`PHONE_VERIF_TITL`, orgName);
    let {userData} = this.props;
    const {setLoading} = this.context;
    setLoading(true);
    const isValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    if (isValid && this.componentIsMounted) {
      ({userData} = this.props);
      const {phoneNumber, isVerified} = userData;
      this.setState({phoneNumber});
      // send token via SMS only if user needs to verify
      if (!isVerified && settings.mobilePhoneVerification) {
        if (!(await this.activePhoneToken())) {
          await this.createPhoneToken();
        }
      }
    }
    setLoading(false);
  }

  componentWillUnmount() {
    this.componentIsMounted = false;
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    setLoading(true);
    event.preventDefault();
    const {orgSlug, setUserData, userData, language} = this.props;
    const {code, errors} = this.state;
    this.setState({errors: {...errors, code: ""}});
    const url = verifyMobilePhoneTokenUrl(orgSlug);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.authToken}`,
      },
      url,
      data: qs.stringify({
        code,
      }),
    })
      .then(() => {
        this.setState({
          errors: {},
        });
        setUserData({
          ...userData,
          isActive: true,
          isVerified: true,
          mustLogin: true,
          username: userData.phoneNumber,
        });
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
    const {orgSlug, language, userData} = this.props;
    const {errors, phoneNumber} = this.state;
    const self = this;
    const url = createMobilePhoneTokenUrl(orgSlug);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.authToken}`,
      },
      url,
      data: qs.stringify({
        phoneNumber,
      }),
    })
      .then((response) => {
        // flag SMS as sent to avoid resending it
        sessionStorage.setItem(self.phoneTokenSentKey, true);
        toast.info(t`TOKEN_SENT`);
        if (response && response.data && response.data.cooldown) {
          this.setState({resendButtonDisabledCooldown: response.data.cooldown});
        }
      })
      .catch((error) => {
        const errorText = getErrorText(error);
        const {data} = error.response;
        if (data && data.cooldown) {
          this.setState({resendButtonDisabledCooldown: data.cooldown});
        }
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

  async activePhoneToken() {
    const {orgSlug, language, userData} = this.props;
    const url = mobilePhoneTokenStatusUrl(orgSlug);
    return axios({
      method: "get",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.authToken}`,
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
    const {code, errors, success, phoneNumber, resendButtonDisabledCooldown} =
      this.state;
    const {orgSlug, mobilePhoneVerification, logout, cookies, setUserData, userData} =
      this.props;
    const {inputFields} = mobilePhoneVerification;
    return (
      <div className="container content" id="mobile-phone-verification">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <form
                className={`${success ? "success" : ""}`}
                onSubmit={this.handleSubmit}
              >
                <div className="row fieldset code">
                  <p className="label">{t`PHONE_VERIFY (${phoneNumber})`}</p>
                  {getError(errors)}

                  <div className="row">
                    {getError(errors, "code")}
                    <input
                      className={`input ${
                        errors.code || errors.nonField ? "error" : ""
                      }`}
                      type="text"
                      id="code"
                      required
                      name="code"
                      value={code}
                      onChange={this.handleChange}
                      placeholder={t`MOBILE_CODE_PHOLD`}
                      pattern={inputFields.code.pattern}
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
                      renderer={({seconds}) => t`RESEND_TOKEN_WAIT_LBL${seconds}`}
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
                <a href={`/${orgSlug}/change-phone-number`} className="button full">
                  {t`PHONE_CHANGE_BTN`}
                </a>
              </div>

              <div className="row fieldset logout">
                <p className="label">{t`LOGOUT_LBL`}</p>
                <button
                  type="button"
                  className="button full"
                  onClick={() =>
                    handleLogout(logout, cookies, orgSlug, setUserData, userData, true)
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
MobilePhoneVerification.contextType = LoadingContext;
MobilePhoneVerification.propTypes = {
  settings: PropTypes.shape({
    mobilePhoneVerification: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  mobilePhoneVerification: PropTypes.shape({
    inputFields: PropTypes.shape({
      code: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
};
