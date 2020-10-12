/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import { Cookies } from "react-cookie";
import { Redirect, withRouter } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PhoneInput from 'react-phone-input-2';
import LoadingContext from "../../utils/loading-context";
import {
  genericError,
  mainToastId,
  mobilePhoneChangeUrl,
  validateApiUrl
} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import Contact from "../contact-box";

class MobilePhoneChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      errors: {}
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validateToken = this.validateToken.bind(this);
  }

  async componentDidMount() {
    await this.validateToken();
  }

  handleSubmit(event) {
    event.preventDefault();
    const { setLoading } = this.context;
    const { orgSlug, language, phone_number_change } = this.props;
    const { text } = phone_number_change;
    const { phone_number, errors } = this.state;
    const url = mobilePhoneChangeUrl(orgSlug);
    const self = this;
    this.setState({ errors: { ...errors, phone_number: "" } });
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      url,
      data: qs.stringify({
        phone_number,
      }),
    })
      .then(() => {
        this.setState({
          errors: {},
        });
        setLoading(false);
        toast.info(getText(text.token_sent, language));
        self.props.history.push(`/${orgSlug}/mobile-phone-verification`);
      })
      .catch(error => {
        const { data } = error.response;
        const errorText = getErrorText(error);
        if (errorText) {
          logError(error, errorText);
          toast.error(errorText);
        }
        setLoading(false);
        this.setState({
          errors: {
            ...errors,
            ...(data.phone_number ? { phone_number: data.phone_number } : null),
            ...(errorText ? { nonField: errorText } : { nonField: "" }),
          },
        });
      });
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  // TODO: make reusable
  async validateToken() {
    const { setLoading } = this.context;
    const {cookies, orgSlug, logout, verifyMobileNumber} = this.props;
    const token = cookies.get(`${orgSlug}_auth_token`);
    const url = validateApiUrl(orgSlug);
    setLoading(true);
    try {
      const response = await axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url,
        data: qs.stringify({
          token,
        }),
      });
      setLoading(false);
      if (response.data.response_code !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL") {
        logout(cookies, orgSlug);
        toast.error(genericError, {
          onOpen: () => toast.dismiss(mainToastId),
        });
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
      } else {
        const {phone_number, is_active} = response.data;
        this.setState({phone_number});
        verifyMobileNumber(!is_active);
      }
      return true;
    } catch (error) {
      logout(cookies, orgSlug);
      toast.error(genericError, {
        onOpen: () => toast.dismiss(mainToastId),
      });
      logError(error, genericError);
      return false;
    }
  }

  render() {
    const { phone_number, errors } = this.state;
    const {
      orgSlug,
      language,
      phone_number_change,
      needsMobilePhoneVerification,
      settings
    } = this.props;
    const { input_fields } = phone_number_change;
    const { buttons } = phone_number_change;

    // check equality to false, it may be undefined
    if (needsMobilePhoneVerification === false || !settings.mobile_phone_verification) {
      return <Redirect to={`/${orgSlug}/status`} />;
    }

    return (
        <>
          <div className="owisp-phone-number-change-container">
            <div className="owisp-phone-number-change-container-inner">
              <div className="owisp-main-content">
                <form
                  className="owisp-phone-number-change-form"
                  onSubmit={this.handleSubmit}
                >

                  <div className="owisp-phone-number-change-fieldset">
                    {errors.nonField && (
                      <div className="owisp-phone-number-change-error owisp-phone-number-change-error-non-field">
                        <span className="owisp-phone-number-change-error-icon">!</span>
                        <span className="owisp-phone-number-change-error-text owisp-phone-number-change-error-text-non-field">
                          {errors.nonField}
                        </span>
                      </div>
                    )}

                    <div className="owisp-phone-number-change-label owisp-phone-number-change-label-phone-number">
                      <label
                        className="owisp-phone-number-change-label-text owisp-phone-number-change-label-text-phone-number"
                        htmlFor="owisp-phone-number-change-phone-number"
                      >
                        {getText(input_fields.phone_number.label, language)}
                      </label>
                      {errors.phone_number && (
                        <div className="owisp-phone-number-change-error owisp-phone-number-change-error-code">
                          <span className="owisp-phone-number-change-error-icon">!</span>
                          <span className="owisp-phone-number-change-error-text owisp-phone-number-change-error-text-code">
                            {errors.phone_number}
                          </span>
                        </div>
                      )}
                      <PhoneInput
                        name="phone_number"
                        country={input_fields.phone_number.country}
                        onlyCountries={input_fields.phone_number.only_countries || []}
                        preferredCountries={input_fields.phone_number.preferred_countries || []}
                        excludeCountries={input_fields.phone_number.exclude_countries || []}
                        value={phone_number}
                        onChange={value => this.setState({phone_number: `+${value}`})}
                        placeholder={getText(
                          input_fields.phone_number.placeholder,
                          language,
                        )}
                        enableSearch={Boolean(input_fields.phone_number.enable_search)}
                        inputProps={{
                          name: "phone_number",
                          id: "owisp-phone-number-change-phone-number",
                          className: `form-control owisp-phone-number-change-input owisp-phone-number-change-input-phone-number ${errors.email ? "error" : ""}`,
                          required: true,
                        }}
                      />
                    </div>
                  </div>

                  <input
                    type="submit"
                    className="owisp-phone-number-change-form-btn owisp-phone-number-change-submit-btn owisp-btn-primary"
                    id="owisp-phone-number-change-submit-btn"
                    value={getText(buttons.change_phone_number.text, language)}
                  />

                  <a className="owisp-btn-primary full-line"
                     id="owisp-phone-number-change-cancel-btn"
                     href={`/${orgSlug}/mobile-phone-verification`}>
                    {getText(buttons.cancel.text, language)}
                  </a>
                </form>
              </div>
              <div className="owisp-phone-number-change-contact-container">
                <Contact />
              </div>
            </div>
          </div>
        </>
    );
  }
}
export default withRouter(MobilePhoneChange);
MobilePhoneChange.contextType = LoadingContext;
MobilePhoneChange.propTypes = {
  phone_number_change: PropTypes.shape({
    input_fields: PropTypes.shape({
      phone_number: PropTypes.shape({
        label: PropTypes.object,
        placeholder: PropTypes.object,
        country: PropTypes.string.isRequired,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool
      }),
    }).isRequired,
    buttons: PropTypes.shape({
      change_phone_number: PropTypes.shape({
        text: PropTypes.object
      }),
      cancel: PropTypes.shape({
        text: PropTypes.object
      }),
    }).isRequired,
    text: PropTypes.shape({
      token_sent: PropTypes.shape().isRequired,
    }).isRequired,
  }).isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  verifyMobileNumber: PropTypes.func.isRequired,
  needsMobilePhoneVerification: PropTypes.bool
};
MobilePhoneChange.defaultProps = {
  needsMobilePhoneVerification: null
};
