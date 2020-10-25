/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import { Link, Route } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingContext from "../../utils/loading-context";

import { mainToastId, passwordConfirmError, registerApiUrl, registerError, registerSuccess } from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import renderAdditionalInfo from "../../utils/render-additional-info";
import Contact from "../contact-box";
import Modal from "../modal";

export default class Registration extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password1: "",
      password2: "",
      errors: {},
      success: false,
      checked: false,
    };
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit(event) {
    const { setLoading } = this.context;
    event.preventDefault();
    const { registration, orgSlug, authenticate } = this.props;
    const { input_fields } = registration;
    const { email, password1, password2, errors } = this.state;
    if (input_fields.password_confirm) {
      if (password1 !== password2) {
        this.setState({
          errors: {
            password2: passwordConfirmError,
          },
        });
        return false;
      }
    }
    this.setState({ errors: { ...errors, password2: null } });
    const url = registerApiUrl.replace("{orgSlug}", orgSlug);
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        email,
        "username": email,
        password1,
        password2,
        checked: this.state.checked
      }),
    })
      .then(() => {
        this.setState({
          errors: {},
          email: "",
          password1: "",
          password2: "",
          success: true,
          checked: false,
        });
        setLoading(false);
        authenticate(true);
        toast.success(registerSuccess, {
          toastId: mainToastId,
        });
      })
      .catch(error => {
        const { data } = error.response;
        const errorText = getErrorText(error, registerError);
        logError(error, errorText);
        setLoading(false);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(data.email ? { email: data.email.toString() } : { email: "" }),
            ...(data.password1
              ? { password1: data.password1.toString() }
              : { password1: "" }),
            ...(data.password2
              ? { password2: data.password2.toString() }
              : { password2: "" }),
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
      match,
    } = this.props;
    const { buttons, additional_info_text, input_fields, links } = registration;
    const { email, password1, password2, checked, errors, success } = this.state;

    return (
      <>
        <div className="owisp-registration-container">
          <div className="owisp-registration-container-inner">
            <form
              className={`owisp-registration-form ${success ? "success" : ""}`}
              onSubmit={this.handleSubmit}
            >
              <div className="owisp-registration-fieldset">
                {errors.nonField && (
                  <div className="owisp-registration-error owisp-registration-error-non-field">
                    <span className="owisp-registration-error-icon">!</span>
                    <span className="owisp-registration-error-text owisp-registration-error-text-non-field">
                      {errors.nonField}
                    </span>
                  </div>
                )}

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
                        className={`owisp-registration-input owisp-registration-input-email ${errors.email ? "error" : ""
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
                        className={`owisp-registration-input owisp-registration-input-confirm ${errors.password2 ? "error" : ""
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
                              input_fields.password_confirm
                                .pattern_description,
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
              <div className="contentTerms" >
                <input
                  name="markTerms"
                  type="checkbox"
                  required
                  onClick={() => this.setState({ checked: !this.state.checked })}
                />
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
              </div>
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
                    disabled={
                      email !== '' && password1 !== '' && password2 !== '' &&
                        checked !== false ? false : true
                    }
                    type="submit"
                    className="owisp-registration-form-btn owisp-registration-submit-btn owisp-btn-primary "
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
            <div className="owisp-registration-contact-container">
              <Contact />
            </div>
          </div>
        </div>
        <Route
          path={`${match.path}/:name`}
          render={props => {
            return <Modal {...props} prevPath={match.url} />;
          }}
        />
      </>
    );
  }
}
Registration.contextType = LoadingContext;
Registration.propTypes = {
  registration: PropTypes.shape({
    header: PropTypes.object,
    buttons: PropTypes.shape({
      register: PropTypes.object,
    }),
    input_fields: PropTypes.shape({
      email: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object,
        placeholder: PropTypes.object,
        pattern: PropTypes.string,
        pattern_description: PropTypes.object
      }),
      password: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object,
        placeholder: PropTypes.object,
        pattern: PropTypes.string,
        pattern_description: PropTypes.object
      }),
      password_confirm: PropTypes.shape({
        type: PropTypes.string.isRequired,
        label: PropTypes.object,
        placeholder: PropTypes.object,
        pattern: PropTypes.string,
        pattern_description: PropTypes.object
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
};
