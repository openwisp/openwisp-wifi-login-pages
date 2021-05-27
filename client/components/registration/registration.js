/* eslint-disable camelcase */
import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Link, Route} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";

import {
  mainToastId,
  passwordConfirmError,
  registerApiUrl,
  registerError,
  registerSuccess,
} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import renderAdditionalInfo from "../../utils/render-additional-info";
import Contact from "../contact-box";
import Modal from "../modal";

export default class Registration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      email: "",
      password1: "",
      password2: "",
      first_name: "",
      last_name: "",
      location: "",
      birth_date: "",
      errors: {},
      success: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {orgSlug, authenticate, settings, setUserData, userData} = this.props;
    const {
      phone_number,
      email,
      first_name,
      last_name,
      birth_date,
      location,
      password1,
      password2,
      errors,
    } = this.state;

    if (password1 !== password2) {
      this.setState({
        errors: {
          password2: passwordConfirmError,
        },
      });
      return false;
    }

    this.setState({errors: {...errors, password2: null}});
    const url = registerApiUrl.replace("{orgSlug}", orgSlug);
    // prepare post data
    const postData = {
      email,
      username: email,
      first_name,
      last_name,
      birth_date,
      location,
      password1,
      password2,
    };
    // add phone_number if SMS verification is enabled
    if (settings.mobile_phone_verification) {
      postData.phone_number = phone_number;
      postData.username = phone_number;
    }
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify(postData),
    })
      .then(() => {
        this.setState({
          errors: {},
          phone_number: "",
          email: "",
          password1: "",
          password2: "",
          success: true,
        });
        // SMS verification flow
        if (settings.mobile_phone_verification) {
          userData.is_active = true;
          userData.is_verified = false;
          setUserData(userData);
          // simple sign up flow
        } else {
          userData.is_active = true;
          setUserData(userData);
          toast.success(registerSuccess, {
            toastId: mainToastId,
          });
        }
        authenticate(true);
        setLoading(false);
      })
      .catch((error) => {
        const {data} = error.response;
        const errorText = getErrorText(error, registerError);
        logError(error, errorText);
        setLoading(false);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(data.phone_number ? {phone_number: data.phone_number} : null),
            ...(data.email ? {email: data.email.toString()} : {email: ""}),
            ...(data.first_name
              ? {first_name: data.first_name.toString()}
              : {first_name: ""}),
            ...(data.last_name
              ? {last_name: data.last_name.toString()}
              : {last_name: ""}),
            ...(data.birth_date
              ? {birth_date: data.birth_date.toString()}
              : {birth_date: ""}),
            ...(data.location
              ? {location: data.location.toString()}
              : {location: ""}),
            ...(data.password1
              ? {password1: data.password1.toString()}
              : {password1: ""}),
            ...(data.password2
              ? {password2: data.password2.toString()}
              : {password2: ""}),
          },
        });
      });
  }

  getLabel = (field) => {
    const {language} = this.props;
    return field.setting === "mandatory"
      ? getText(field.label, language)
      : getText(field.label_optional, language);
  };

  render() {
    const {
      registration,
      settings,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
      match,
    } = this.props;
    const {buttons, additional_info_text, input_fields, links} = registration;
    const {
      phone_number,
      email,
      first_name,
      last_name,
      birth_date,
      location,
      password1,
      password2,
      errors,
      success,
    } = this.state;
    return (
      <>
        <div className="container content" id="registration">
          <div className="inner">
            <form
              className={`main-column ${success ? "success" : ""}`}
              onSubmit={this.handleSubmit}
              id="registration-form"
            >
              <div className="fieldset">
                {errors.nonField && (
                  <div className="error non-field">
                    <span className="icon">!</span>
                    <span className="text">{errors.nonField}</span>
                  </div>
                )}

                {settings.mobile_phone_verification &&
                  input_fields.phone_number && (
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
                          submitOnEnter(event, this, "registration-form");
                        }}
                        placeholder={getText(
                          input_fields.phone_number.placeholder,
                          language,
                        )}
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
                    </div>
                  )}

                <div className="row email">
                  <label htmlFor="email">
                    {getText(input_fields.email.label, language)}
                  </label>
                  {errors.email && (
                    <div className="error email">
                      <span className="icon">!</span>
                      <span className="text text-email">{errors.email}</span>
                    </div>
                  )}
                  <input
                    className={`input ${errors.email ? "error" : ""}`}
                    type={input_fields.email.type}
                    id="email"
                    required
                    name="email"
                    value={email}
                    onChange={this.handleChange}
                    placeholder={getText(
                      input_fields.email.placeholder,
                      language,
                    )}
                    pattern={input_fields.email.pattern}
                    title={getText(
                      input_fields.email.pattern_description,
                      language,
                    )}
                  />
                </div>

                {input_fields.first_name.setting !== "disabled" && (
                  <div className="row first_name">
                    <label htmlFor="first_name">
                      {this.getLabel(input_fields.first_name)}
                    </label>
                    {errors.first_name && (
                      <div className="error first_name">
                        <span className="icon">!</span>
                        <span className="text text-first_name">
                          {errors.first_name}
                        </span>
                      </div>
                    )}
                    <input
                      className={`input ${errors.first_name ? "error" : ""}`}
                      type={input_fields.first_name.type}
                      id="first_name"
                      required={input_fields.first_name.setting === "mandatory"}
                      name="first_name"
                      value={first_name}
                      onChange={this.handleChange}
                      placeholder={getText(
                        input_fields.first_name.placeholder,
                        language,
                      )}
                      pattern={input_fields.first_name.pattern}
                      title={getText(
                        input_fields.first_name.pattern_description,
                        language,
                      )}
                    />
                  </div>
                )}

                {input_fields.last_name.setting !== "disabled" && (
                  <div className="row last_name">
                    <label htmlFor="last_name">
                      {this.getLabel(input_fields.last_name)}
                    </label>
                    {errors.last_name && (
                      <div className="error last_name">
                        <span className="icon">!</span>
                        <span className="text text-last_name">
                          {errors.last_name}
                        </span>
                      </div>
                    )}
                    <input
                      className={`input ${errors.last_name ? "error" : ""}`}
                      type={input_fields.last_name.type}
                      id="last_name"
                      required={input_fields.last_name.setting === "mandatory"}
                      name="last_name"
                      value={last_name}
                      onChange={this.handleChange}
                      placeholder={getText(
                        input_fields.last_name.placeholder,
                        language,
                      )}
                      pattern={input_fields.last_name.pattern}
                      title={getText(
                        input_fields.last_name.pattern_description,
                        language,
                      )}
                    />
                  </div>
                )}

                {input_fields.birth_date.setting !== "disabled" && (
                  <div className="row birth_date">
                    <label htmlFor="birth_date">
                      {this.getLabel(input_fields.birth_date)}
                    </label>
                    {errors.birth_date && (
                      <div className="error birth_date">
                        <span className="icon">!</span>
                        <span className="text text-birth_date">
                          {errors.birth_date}
                        </span>
                      </div>
                    )}
                    <input
                      className={`input ${errors.birth_date ? "error" : ""}`}
                      type={input_fields.birth_date.type}
                      id="birth_date"
                      required={input_fields.birth_date.setting === "mandatory"}
                      name="birth_date"
                      value={birth_date}
                      onChange={this.handleChange}
                    />
                  </div>
                )}

                {input_fields.location.setting !== "disabled" && (
                  <div className="row location">
                    <label htmlFor="location">
                      {this.getLabel(input_fields.location)}
                    </label>
                    {errors.location && (
                      <div className="error location">
                        <span className="icon">!</span>
                        <span className="text text-location">
                          {errors.location}
                        </span>
                      </div>
                    )}
                    <input
                      className={`input ${errors.location ? "error" : ""}`}
                      type={input_fields.location.type}
                      id="location"
                      required={input_fields.location.setting === "mandatory"}
                      name="location"
                      value={location}
                      onChange={this.handleChange}
                      placeholder={getText(
                        input_fields.location.placeholder,
                        language,
                      )}
                      pattern={input_fields.location.pattern}
                      title={getText(
                        input_fields.location.pattern_description,
                        language,
                      )}
                    />
                  </div>
                )}

                <div className="row password">
                  <label htmlFor="password">
                    {getText(input_fields.password.label, language)}
                  </label>
                  {errors.password1 && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text">{errors.password1}</span>
                    </div>
                  )}
                  <input
                    className={`input ${errors.password1 ? "error" : ""}`}
                    type={input_fields.password.type}
                    id="password"
                    required
                    name="password1"
                    value={password1}
                    onChange={this.handleChange}
                    placeholder={getText(
                      input_fields.password.placeholder,
                      language,
                    )}
                    pattern={input_fields.password.pattern}
                    title={getText(input_fields.password.pattern_description)}
                  />
                </div>

                <div className="row password-confirm">
                  <label htmlFor="password-confirm">
                    {getText(input_fields.password_confirm.label, language)}
                  </label>
                  {errors.password2 && (
                    <div className="error confirm">
                      <span className="icon">!</span>
                      <span className="text text-confirm">
                        {errors.password2}
                      </span>
                    </div>
                  )}
                  <input
                    className={`input ${errors.password2 ? "error" : ""}`}
                    type={input_fields.password_confirm.type}
                    id="password-confirm"
                    required
                    name="password2"
                    value={password2}
                    onChange={this.handleChange}
                    placeholder={getText(
                      input_fields.password_confirm.placeholder,
                      language,
                    )}
                    pattern={input_fields.password.pattern}
                    title={getText(
                      input_fields.password.pattern_description,
                      language,
                    )}
                  />
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
                    "registration",
                  )}
                </div>
              )}

              <div className="row register">
                <input
                  type="submit"
                  className="button full"
                  value={getText(buttons.register.text, language)}
                />
              </div>

              {links && (
                <div className="row links">
                  {links.forget_password && (
                    <p>
                      <Link to={`/${orgSlug}/password/reset`} className="link">
                        {getText(links.forget_password, language)}
                      </Link>
                    </p>
                  )}
                  {links.login && (
                    <p>
                      <Link to={`/${orgSlug}/login`} className="link">
                        {getText(links.login, language)}
                      </Link>
                    </p>
                  )}
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
Registration.contextType = LoadingContext;
Registration.propTypes = {
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  registration: PropTypes.shape({
    header: PropTypes.object,
    buttons: PropTypes.shape({
      register: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
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
      password_confirm: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
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
      first_name: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      last_name: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      location: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }),
      birth_date: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object.isRequired,
        label_optional: PropTypes.object.isRequired,
        setting: PropTypes.string.isRequired,
      }),
    }),
    additional_info_text: PropTypes.object,
    links: PropTypes.object,
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
};
