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
  userInactiveError,
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
      username: "",
      password: "",
      remember_me: true,
      errors: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const username = getParameterByName("username");
    const token = getParameterByName("token");
    const {loginForm} = this.props;
    let remember_me;

    if (localStorage.getItem("rememberMe") !== null) {
      remember_me = localStorage.getItem("rememberMe") === "true";
    } else {
      remember_me = loginForm.input_fields.remember_me.value;
    }
    this.setState({remember_me});

    if (username && token) {
      this.setState(
        {
          username,
          password: token,
        },
        () => {
          this.handleSubmit();
        },
      );
    }
  }

  getUsernameField = (input_fields) => {
    const {settings} = this.props;
    let usePhoneNumberField;
    if (typeof input_fields.username.auto_switch_phone_input !== "undefined") {
      usePhoneNumberField = Boolean(
        input_fields.username.auto_switch_phone_input,
      );
    } else {
      usePhoneNumberField = settings.mobile_phone_verification;
    }

    if (usePhoneNumberField) {
      return this.getPhoneNumberField(input_fields);
    }
    return this.getTextField(input_fields);
  };

  getTextField = (input_fields) => {
    const {username, errors} = this.state;
    const {language} = this.props;
    return (
      <div className="row username">
        <label htmlFor="username">
          {getText(input_fields.username.label, language)}
        </label>
        {errors.username && (
          <div className="error">
            <span className="icon">!</span>
            <span className="text">{errors.username}</span>
          </div>
        )}
        <input
          className={`input ${errors.username ? "error" : ""}`}
          type={input_fields.username.type}
          id="username"
          name="username"
          value={username}
          onChange={this.handleChange}
          required
          placeholder={getText(input_fields.username.placeholder, language)}
          pattern={input_fields.username.pattern}
          title={getText(input_fields.username.pattern_description, language)}
        />
      </div>
    );
  };

  getPhoneNumberField = (input_fields) => {
    const {username, errors} = this.state;
    const {language} = this.props;
    return (
      <div className="row phone-number">
        <label htmlFor="phone-number">
          {getText(input_fields.phone_number.label, language)}
        </label>
        {errors.username && (
          <div className="error">
            <span className="icon">!</span>
            <span className="text">{errors.username}</span>
          </div>
        )}
        <PhoneInput
          name="username"
          country={input_fields.phone_number.country}
          onlyCountries={input_fields.phone_number.only_countries || []}
          preferredCountries={
            input_fields.phone_number.preferred_countries || []
          }
          excludeCountries={input_fields.phone_number.exclude_countries || []}
          value={username}
          onChange={(value) =>
            this.handleChange({
              target: {name: "username", value: `+${value}`},
            })
          }
          placeholder={getText(input_fields.phone_number.placeholder, language)}
          enableSearch={Boolean(input_fields.phone_number.enable_search)}
          inputProps={{
            name: "username",
            id: "username",
            className: `form-control input ${errors.username ? "error" : ""}`,
            required: true,
          }}
        />
      </div>
    );
  };

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    if (event) event.preventDefault();
    const {orgSlug, authenticate, settings, setUserData} = this.props;
    const {username, password, remember_me, errors} = this.state;
    const url = loginApiUrl(orgSlug);
    this.setState({
      errors: {},
    });
    localStorage.setItem("rememberMe", remember_me);
    setLoading(true);

    const handleAuthentication = (data) => {
      if (!remember_me)
        sessionStorage.setItem(`${orgSlug}_auth_token`, data.key);
      authenticate(true);
      toast.success(loginSuccess, {
        toastId: mainToastId,
      });
      setLoading(false);
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
        setUserData(res.data);
        return handleAuthentication(res.data);
      })
      .catch((error) => {
        const {data} = error.response;
        setUserData(data);
        if (
          error.response.status === 401 &&
          settings.mobile_phone_verification &&
          data.is_active
        ) {
          return handleAuthentication(data);
        }
        const errorText =
          data.is_active === false
            ? getErrorText(error, userInactiveError)
            : getErrorText(error, loginError);
        logError(error, errorText);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(data.username
              ? {username: data.username.toString()}
              : {username: ""}),
            ...(data.password ? {password: data.password} : {password: ""}),
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

                {this.getUsernameField(input_fields)}

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
      username: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
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
  setUserData: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
};
