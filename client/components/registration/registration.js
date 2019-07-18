import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";

import {passwordConfirmError, registerApiUrl} from "../../constants";
import getText from "../../utils/get-text";

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
    const {registration, orgSlug} = this.props;
    const inputFields = registration.input_fields;
    const {username, email, password1, password2, errors} = this.state;
    if (inputFields.password_confirm) {
      if (password1 !== password2) {
        this.setState({
          errors: {
            ...errors,
            password2: passwordConfirmError,
          },
        });
        return;
      }
    }
    this.setState({errors: {...errors, password2: null}});
    const url = registerApiUrl.replace("{orgSlug}", orgSlug);
    axios({
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
    const {registration, language} = this.props;
    const inputFields = registration.input_fields;
    const {buttons} = registration;
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
              {inputFields.username ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-username"
                    htmlFor="owisp-registration-username"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(inputFields.username.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input
                      owisp-registration-input-username
                      ${errors.username ? "error" : ""}`}
                      type={inputFields.username.type}
                      id="owisp-registration-username"
                      name="username"
                      value={username}
                      onChange={this.handleChange}
                      required
                      placeholder={getText(
                        inputFields.username.placeholder,
                        language,
                      )}
                      pattern={
                        inputFields.username.pattern
                          ? inputFields.username.pattern
                          : undefined
                      }
                      title={
                        inputFields.username.pattern_description
                          ? getText(
                              inputFields.username.pattern_description,
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

              {inputFields.email ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-email"
                    htmlFor="owisp-registration-email"
                  >
                    <div className="owisp-registration-label-text owisp-registration-label-text-email">
                      {getText(inputFields.email.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input owisp-registration-input-email ${
                        errors.email ? "error" : ""
                      }`}
                      type={inputFields.email.type}
                      id="owisp-registration-email"
                      required
                      name="email"
                      value={email}
                      onChange={this.handleChange}
                      placeholder={getText(
                        inputFields.email.placeholder,
                        language,
                      )}
                      pattern={
                        inputFields.email.pattern
                          ? inputFields.email.pattern
                          : undefined
                      }
                      title={
                        inputFields.email.pattern_description
                          ? getText(
                              inputFields.email.pattern_description,
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

              {inputFields.password ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-password"
                    htmlFor="owisp-registration-password"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(inputFields.password.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input owisp-registration-input-password
                      ${errors.password1 ? "error" : ""}`}
                      type={inputFields.password.type}
                      id="owisp-registration-password"
                      required
                      name="password1"
                      value={password1}
                      onChange={this.handleChange}
                      placeholder={getText(
                        inputFields.password.placeholder,
                        language,
                      )}
                      pattern={
                        inputFields.password.pattern
                          ? inputFields.password.pattern
                          : undefined
                      }
                      title={
                        inputFields.password.pattern_description
                          ? getText(
                              inputFields.password.pattern_description,
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

              {inputFields.password_confirm ? (
                <>
                  <label
                    className="owisp-registration-label owisp-registration-label-confirm"
                    htmlFor="owisp-registration-password-confirm"
                  >
                    <div className="owisp-registration-label-text">
                      {getText(inputFields.password_confirm.label, language)}
                    </div>
                    <input
                      className={`owisp-registration-input owisp-registration-input-confirm ${
                        errors.password2 ? "error" : ""
                      }`}
                      type={inputFields.password_confirm.type}
                      id="owisp-registration-password-confirm"
                      required
                      name="password2"
                      value={password2}
                      onChange={this.handleChange}
                      placeholder={getText(
                        inputFields.password_confirm.placeholder,
                        language,
                      )}
                      pattern={
                        inputFields.password_confirm.pattern
                          ? inputFields.password_confirm.pattern
                          : undefined
                      }
                      title={
                        inputFields.password_confirm.pattern_description
                          ? getText(
                              inputFields.password_confirm.pattern_description,
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
            <input
              type="submit"
              className="owisp-registration-submit-btn"
              value={getText(buttons.register, language)}
            />
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
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
};
