/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Link, Route} from "react-router-dom";
import {toast} from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "react-toastify/dist/ReactToastify.css";

import {
  loginApiUrl,
  loginError,
  loginSuccess,
  mainToastId,
} from "../../constants";
import getAssetPath from "../../utils/get-asset-path";
import getErrorText from "../../utils/get-error-text";
import getParameterByName from "../../utils/get-parameter-by-name";
import getText from "../../utils/get-text";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import renderAdditionalInfo from "../../utils/render-additional-info";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";
import Modal from "../modal";

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      phone_number: "",
      remember_me: true,
      errors: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const email = getParameterByName("email");
    const token = getParameterByName("token");

    const {loginForm} = this.props;
    let remember_me;
    if (localStorage.getItem("rememberMe") !== null)
      remember_me = localStorage.getItem("rememberMe") === "true";
    else remember_me = loginForm.input_fields.remember_me.value;
    this.setState({remember_me});

    if (email && token) {
      this.setState(
        {
          email,
          password: token,
        },
        () => {
          this.handleSubmit();
        },
      );
    }
  }

  getEmailField = (input_fields) => {
    const {email, errors} = this.state;
    const {language} = this.props;
    return (
      <div className="row email">
        <label htmlFor="email">
          {getText(input_fields.email.label, language)}
        </label>
        {errors.email && (
          <div className="error">
            <span className="icon">!</span>
            <span className="text">{errors.email}</span>
          </div>
        )}
        <input
          className={`input ${errors.email ? "error" : ""}`}
          type={input_fields.email.type}
          id="email"
          name="email"
          value={email}
          onChange={this.handleChange}
          required
          placeholder={getText(input_fields.email.placeholder, language)}
          pattern={input_fields.email.pattern}
          title={getText(input_fields.email.pattern_description, language)}
        />
      </div>
    );
  };

  getPhoneNumberField = (input_fields) => {
    const {phone_number, errors} = this.state;
    const {language} = this.props;
    return (
      <div className="row phone-number">
        <label htmlFor="phone-number">
          {getText(input_fields.phone_number.label, language)}
        </label>
        {errors.phone_number && (
          <div className="error">
            <span className="icon">!</span>
            <span className="text">{errors.phone_number}</span>
          </div>
        )}
        <PhoneInput
          name="phone_number"
          country={input_fields.phone_number.country}
          onlyCountries={input_fields.phone_number.only_countries || []}
          preferredCountries={
            input_fields.phone_number.preferred_countries || []
          }
          excludeCountries={input_fields.phone_number.exclude_countries || []}
          value={phone_number}
          onChange={(value) =>
            this.handleChange({
              target: {name: "phone_number", value: `+${value}`},
            })
          }
          placeholder=""
          enableSearch={Boolean(input_fields.phone_number.enable_search)}
          inputProps={{
            name: "phone_number",
            id: "phone-number",
            className: `form-control input ${
              errors.phone_number ? "error" : ""
            }`,
            required: true,
          }}
        />
      </div>
    );
  };

  getPhoneNumberOrEmailField = (input_fields) => {
    const {settings} = this.props;

    if (settings.mobile_phone_verification) {
      return this.getPhoneNumberField(input_fields);
    }
    return this.getEmailField(input_fields);
  };

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    if (event) event.preventDefault();
    const {orgSlug, authenticate, verifyMobileNumber, settings} = this.props;
    const {email, password, phone_number, remember_me, errors} = this.state;
    const username = settings.mobile_phone_verification ? phone_number : email;
    const url = loginApiUrl(orgSlug);
    this.setState({
      errors: {},
    });
    localStorage.setItem("rememberMe", remember_me);
    setLoading(true);

    const handleAuthentication = (
      needsMobileVerification = false,
      data = {},
    ) => {
      if (!remember_me)
        sessionStorage.setItem(`${orgSlug}_auth_token`, data.key);
      authenticate(true);
      toast.success(loginSuccess, {
        toastId: mainToastId,
      });
      setLoading(false);
      if (needsMobileVerification) {
        verifyMobileNumber(true);
      }
    };

    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        username,
        password,
      }),
    })
      .then((res = {}) => {
        return handleAuthentication(
          settings.mobile_phone_verification,
          res.data,
        );
      })
      .catch((error) => {
        const {data} = error.response;
        if (
          error.response.status === 401 &&
          settings.mobile_phone_verification
        ) {
          return handleAuthentication(true);
        }
        const errorText = getErrorText(error, loginError);
        logError(error, errorText);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(data.email ? {email: data.email.toString()} : {email: ""}),
            ...(data.password ? {password: data.password} : {password: ""}),
            ...(data.phone_number
              ? {phone_number: data.phone_number}
              : {phone_number: ""}),
          },
        });
        return setLoading(false);
      });
  }

  handleCheckBoxChange = (event) => {
    this.setState({
      remember_me: event.target.checked,
    });
  };

  render() {
    const {errors, password, remember_me} = this.state;
    const {
      language,
      loginForm,
      orgSlug,
      termsAndConditions,
      privacyPolicy,
      match,
    } = this.props;
    const {
      links,
      buttons,
      input_fields,
      social_login,
      additional_info_text,
    } = loginForm;
    return (
      <>
        <div className="container content" id="login">
          <div className="inner">
            <form className="main-column" onSubmit={this.handleSubmit}>
              {social_login && social_login.links && (
                <div className="social-links row">
                  {social_login.links.map((link) => {
                    return (
                      <p key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-link button full"
                        >
                          <span className="inner">
                            <img
                              src={getAssetPath(orgSlug, link.icon)}
                              alt={getText(link.text, language)}
                              className="icon"
                            />
                            <span className="text">
                              {getText(link.text, language)}
                            </span>
                          </span>
                        </a>
                      </p>
                    );
                  })}
                </div>
              )}

              <div className="fieldset">
                {errors.nonField && (
                  <div className="error non-field">
                    <span className="icon">!</span>
                    <span className="text">{errors.nonField}</span>
                  </div>
                )}

                {this.getPhoneNumberOrEmailField(input_fields)}

                <div className="row password">
                  <label htmlFor="password">
                    {getText(input_fields.password.label, language)}
                  </label>
                  {errors.password && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text">{errors.password}</span>
                    </div>
                  )}
                  <input
                    className={`input ${errors.password ? "error" : ""}`}
                    type={input_fields.password.type}
                    id="password"
                    required
                    name="password"
                    value={password}
                    onChange={this.handleChange}
                    placeholder={getText(
                      input_fields.password.placeholder,
                      language,
                    )}
                    pattern={input_fields.password.pattern}
                    title={getText(
                      input_fields.password.pattern_description,
                      language,
                    )}
                  />
                </div>

                <div className="row remember-me">
                  <input
                    type={input_fields.remember_me.type}
                    id="remember_me"
                    name="remember_me"
                    className="remember-me"
                    checked={remember_me}
                    onChange={this.handleCheckBoxChange}
                  />
                  <label htmlFor="remember_me">
                    {getText(input_fields.remember_me.label, language)}
                  </label>
                </div>
              </div>

              {additional_info_text && (
                <div className="row add-info">
                  {renderAdditionalInfo(
                    additional_info_text,
                    language,
                    termsAndConditions,
                    privacyPolicy,
                    orgSlug,
                    "login",
                  )}
                </div>
              )}

              <div className="row login">
                <input
                  type="submit"
                  className="button full"
                  value={getText(buttons.login.text, language)}
                />
              </div>

              {buttons.register && (
                <div className="row register">
                  <p>{getText(buttons.register.label, language)}</p>
                  <Link to={`/${orgSlug}/registration`} className="button full">
                    {getText(buttons.register.text, language)}
                  </Link>
                </div>
              )}

              {links && links.forget_password && (
                <div className="row links">
                  <Link to={`/${orgSlug}/password/reset`} className="link">
                    {getText(links.forget_password, language)}
                  </Link>
                </div>
              )}
            </form>

            <Contact />
          </div>
        </div>
        <Route
          path={`${match.path}/:name`}
          render={(props) => {
            return <Modal {...props} prevPath={match.url} />;
          }}
        />
      </>
    );
  }
}

Login.contextType = LoadingContext;
Login.propTypes = {
  loginForm: PropTypes.shape({
    social_login: PropTypes.shape({
      divider_text: PropTypes.object,
      description: PropTypes.object,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string.isRequired,
          icon: PropTypes.string.isRequired,
          text: PropTypes.shape().isRequired,
        }),
      ),
    }),
    input_fields: PropTypes.shape({
      email: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }).isRequired,
      password: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }).isRequired,
      phone_number: PropTypes.shape({
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        country: PropTypes.string,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
      remember_me: PropTypes.shape({
        type: PropTypes.string.isRequired,
        value: PropTypes.bool.isRequired,
        label: PropTypes.object.isRequired,
      }),
    }),
    additional_info_text: PropTypes.object,
    buttons: PropTypes.shape({
      login: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
      register: PropTypes.shape({
        label: PropTypes.object.isRequired,
        text: PropTypes.object.isRequired,
      }),
    }).isRequired,
    links: PropTypes.shape({
      forget_password: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
  language: PropTypes.string.isRequired,
  match: PropTypes.shape({
    path: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  privacyPolicy: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object,
  }).isRequired,
  termsAndConditions: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object,
  }).isRequired,
  authenticate: PropTypes.func.isRequired,
  verifyMobileNumber: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
};
