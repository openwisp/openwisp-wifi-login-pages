/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Link} from "react-router-dom";

import {passwordConfirmError, registerApiUrl} from "../../constants";
import getText from "../../utils/get-text";
import renderAdditionalInfo from "../../utils/render-additional-info";

export default class Registration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      email: "",
      password1: "",
      password2: "",
      errors: {},
      success: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    const {registration, orgSlug, authenticate} = this.props;
    const {input_fields} = registration;
    const {username, email, password1, password2, errors} = this.state;
    if (input_fields.password_confirm) {
      if (password1 !== password2) {
        this.setState({
          errors: {
            ...errors,
            password2: passwordConfirmError,
          },
        });
        return false;
      }
    }
    this.setState({errors: {...errors, password2: null}});
    const url = registerApiUrl.replace("{orgSlug}", orgSlug);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        email,
        username,
        password1,
        password2,
      }),
    })
      .then(() => {
        this.setState({
          errors: {},
          username: "",
          email: "",
          password1: "",
          password2: "",
          success: true,
        });
        authenticate(true);
      })
      .catch(error => {
        const {data} = error.response;
        this.setState({
          errors: {
            ...errors,
            ...(data.username
              ? {username: data.username.toString()}
              : {username: ""}),
            ...(data.email ? {email: data.email.toString()} : {email: ""}),
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

  render() {
    const {
      registration,
      language,
      termsAndConditions,
      privacyPolicy,
      orgSlug,
    } = this.props;
    const {buttons, additional_info_text, input_fields, links} = registration;
    const {username, email, password1, password2, errors, success} = this.state;
    return (
      <React.Fragment>
        <div className="owisp-registration-container">
          <form
            className={`owisp-registration-form ${success ? "success" : ""}`}
            onSubmit={this.handleSubmit}
          >
            <div className="owisp-registration-header">
              <div className="owisp-registration-header-content">
                {getText(registration.header, language)}
              </div>
            </div>
            <div className="owisp-registration-fieldset">
              {input_fields.username ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-username"
                    htmlFor="owisp-registration-username"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(input_fields.username.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input
                      owisp-registration-input-username
                      ${errors.username ? "error" : ""}`}
                      type={input_fields.username.type}
                      id="owisp-registration-username"
                      name="username"
                      value={username}
                      onChange={this.handleChange}
                      required
                      placeholder={getText(
                        input_fields.username.placeholder,
                        language,
                      )}
                      pattern={
                        input_fields.username.pattern
                          ? input_fields.username.pattern
                          : undefined
                      }
                      title={
                        input_fields.username.pattern_description
                          ? getText(
                              input_fields.username.pattern_description,
                              language,
                            )
                          : undefined
                      }
                    />
                  </label>
                  {errors.username && (
                    <div className="owisp-registration-error owisp-registration-error-username">
                      <span className="owisp-registration-error-icon">!</span>
                      <span className="owisp-registration-error-text owisp-registration-error-text-username">
                        {errors.username}
                      </span>
                    </div>
                  )}
                </>
              ) : null}

              {input_fields.email ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-email"
                    htmlFor="owisp-registration-email"
                  >
                    <div className="owisp-registration-label-text owisp-registration-label-text-email">
                      {getText(input_fields.email.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input owisp-registration-input-email ${
                        errors.email ? "error" : ""
                      }`}
                      type={input_fields.email.type}
                      id="owisp-registration-email"
                      required
                      name="email"
                      value={email}
                      onChange={this.handleChange}
                      placeholder={getText(
                        input_fields.email.placeholder,
                        language,
                      )}
                      pattern={
                        input_fields.email.pattern
                          ? input_fields.email.pattern
                          : undefined
                      }
                      title={
                        input_fields.email.pattern_description
                          ? getText(
                              input_fields.email.pattern_description,
                              language,
                            )
                          : undefined
                      }
                    />
                  </label>
                  {errors.email && (
                    <div className="owisp-registration-error owisp-registration-error-email">
                      <span className="owisp-registration-error-icon">!</span>
                      <span className="owisp-registration-error-text owisp-registration-error-text-email">
                        {errors.email}
                      </span>
                    </div>
                  )}
                </>
              ) : null}

              {input_fields.password ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-password"
                    htmlFor="owisp-registration-password"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(input_fields.password.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input owisp-registration-input-password
                      ${errors.password1 ? "error" : ""}`}
                      type={input_fields.password.type}
                      id="owisp-registration-password"
                      required
                      name="password1"
                      value={password1}
                      onChange={this.handleChange}
                      placeholder={getText(
                        input_fields.password.placeholder,
                        language,
                      )}
                      pattern={
                        input_fields.password.pattern
                          ? input_fields.password.pattern
                          : undefined
                      }
                      title={
                        input_fields.password.pattern_description
                          ? getText(
                              input_fields.password.pattern_description,
                              language,
                            )
                          : undefined
                      }
                    />
                  </label>
                  {errors.password1 && (
                    <div className="owisp-registration-error owisp-registration-error-password">
                      <span className="owisp-registration-error-icon">!</span>
                      <span className="owisp-registration-error-text owisp-registration-error-text-password">
                        {errors.password1}
                      </span>
                    </div>
                  )}
                </>
              ) : null}

              {input_fields.password_confirm ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-confirm"
                    htmlFor="owisp-registration-password-confirm"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(input_fields.password_confirm.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input owisp-registration-input-confirm ${
                        errors.password2 ? "error" : ""
                      }`}
                      type={input_fields.password_confirm.type}
                      id="owisp-registration-password-confirm"
                      required
                      name="password2"
                      value={password2}
                      onChange={this.handleChange}
                      placeholder={getText(
                        input_fields.password_confirm.placeholder,
                        language,
                      )}
                      pattern={
                        input_fields.password_confirm.pattern
                          ? input_fields.password_confirm.pattern
                          : undefined
                      }
                      title={
                        input_fields.password_confirm.pattern_description
                          ? getText(
                              input_fields.password_confirm.pattern_description,
                              language,
                            )
                          : undefined
                      }
                    />
                  </label>
                  {errors.password2 && (
                    <div className="owisp-registration-error owisp-registration-error-confirm">
                      <span className="owisp-registration-error-icon">!</span>
                      <span className="owisp-registration-error-text owisp-registration-error-text-confirm">
                        {errors.password2}
                      </span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            {additional_info_text ? (
              <div className="owisp-registration-add-info">
                {renderAdditionalInfo(
                  additional_info_text,
                  language,
                  termsAndConditions,
                  privacyPolicy,
                  orgSlug,
                  "registration",
                )}
              </div>
            ) : null}
            {buttons.register ? (
              <>
                {buttons.register.label ? (
                  <label
                    className="owisp-registration-label owisp-registration-label-registration-btn"
                    htmlFor="owisp-registration-registration-btn"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(buttons.register.label, language)}
                    </div>
                  </label>
                ) : null}
                <input
                  type="submit"
                  className="owisp-registration-form-btn owisp-registration-submit-btn"
                  id="owisp-registration-submit-btn"
                  value={getText(buttons.register.text, language)}
                />
              </>
            ) : null}
            {links ? (
              <div className="owisp-login-links-div">
                {links.forget_password ? (
                  <Link
                    to={`/${orgSlug}/password/reset`}
                    className="owisp-login-link"
                  >
                    {getText(links.forget_password, language)}
                  </Link>
                ) : null}
                {links.login ? (
                  <Link
                    to={`/${orgSlug}/login`}
                    className="owisp-registration-link"
                  >
                    {getText(links.login, language)}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </form>
        </div>
      </React.Fragment>
    );
  }
}

Registration.propTypes = {
  registration: PropTypes.shape({
    header: PropTypes.object,
    buttons: PropTypes.shape({
      register: PropTypes.object,
    }),
    input_fields: PropTypes.shape({
      email: PropTypes.object,
      password: PropTypes.object,
      password_confirm: PropTypes.object,
      username: PropTypes.object,
    }),
    additional_info_text: PropTypes.object,
    links: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
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
};
