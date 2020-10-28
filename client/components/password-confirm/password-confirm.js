import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingContext from "../../utils/loading-context";

import { confirmApiUrl, passwordConfirmError } from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";

export default class PasswordConfirm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newPassword1: "",
      newPassword2: "",
      errors: {},
      success: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit(event) {
    const { setLoading } = this.context;
    event.preventDefault();
    const { passwordConfirm, orgSlug, match } = this.props;
    const inputFields = passwordConfirm.input_fields;
    const { newPassword1, newPassword2, errors } = this.state;
    if (inputFields.password_confirm) {
      if (newPassword1 !== newPassword2) {
        this.setState({
          errors: {
            newPassword2: passwordConfirmError,
          },
        });
        return false;
      }
    }
    this.setState({ errors: { ...errors, newPassword2: "" } });
    const url = confirmApiUrl.replace("{orgSlug}", orgSlug);
    const { uid, token } = match.params;
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        uid,
        token,
        newPassword1,
        newPassword2,
      }),
    })
      .then(response => {
        this.setState({
          errors: {},
          success: response.data.detail,
        });
        setLoading(false);
        toast.success(response.data.detail);
      })
      .catch(error => {
        const errorText = getErrorText(error);
        logError(error, errorText);
        toast.error(errorText);
        setLoading(false);
        this.setState({
          success: false,
          errors: {
            ...errors,
            ...(errorText ? { nonField: errorText } : { nonField: "" }),
          },
        });
      });
  }

  render() {
    const { newPassword1, newPassword2, errors, success } = this.state;
    const { language, passwordConfirm, orgSlug } = this.props;
    const inputFields = passwordConfirm.input_fields;
    const loginPageLink = passwordConfirm.login_page_link;
    const { buttons } = passwordConfirm;
    return (
      <>
        <div className="owisp-password-confirm-container">
          {success ? (
            <div className="owisp-password-confirm-form">
              <div className="owisp-password-confirm-message-container">
                <div className="owisp-password-confirm-icon">
                  <div className="owisp-password-confirm-tick" />
                </div>
                <div className="owisp-password-confirm-success">{success}</div>
              </div>
            </div>
          ) : (
              <form
                className="owisp-password-confirm-form"
                onSubmit={this.handleSubmit}
              >
                <div className="owisp-password-confirm-header">
                  <div className="owisp-password-confirm-heading">
                    {getText(passwordConfirm.heading, language)}
                  </div>
                  <div className="owisp-password-confirm-subheading">
                    {getText(passwordConfirm.additional_text, language)}
                  </div>
                </div>
                <div className="owisp-password-confirm-fieldset">
                  {errors.nonField && (
                    <div className="owisp-password-confirm-error owisp-password-confirm-error-non-field">
                      <span className="owisp-password-confirm-error-icon">!</span>
                      <span className="owisp-password-confirm-error-text owisp-password-confirm-error-text-non-field">
                        {errors.nonField}
                      </span>
                    </div>
                  )}
                  {inputFields.password ? (
                    <>
                      <label
                        className="owisp-password-confirm-label owisp-password-confirm-label-text owisp-password-confirm-label-password"
                        htmlFor="owisp-password-confirm-password"
                      >
                        {getText(inputFields.password.label, language)}
                        <input
                          className={`owisp-password-confirm-input owisp-password-confirm-input-password
                      ${errors.newPassword1 ? "error" : ""}`}
                          type={inputFields.password.type}
                          id="owisp-password-confirm-password"
                          required
                          name="newPassword1"
                          value={newPassword1}
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
                      {errors.newPassword1 && (
                        <div className="owisp-password-confirm-error owisp-password-confirm-error-password">
                          <span className="owisp-password-confirm-error-icon">
                            !
                        </span>
                          <span className="owisp-password-confirm-error-text owisp-password-confirm-error-text-password">
                            {errors.newPassword1}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}

                  {inputFields.password_confirm ? (
                    <>
                      <label
                        className="owisp-password-confirm-label owisp-password-confirm-label-text owisp-password-confirm-label-confirm"
                        htmlFor="owisp-password-confirm-password-confirm"
                      >
                        {getText(inputFields.password_confirm.label, language)}
                        <input
                          className={`owisp-password-confirm-input owisp-password-confirm-input-confirm ${
                            errors.newPassword2 ? "error" : ""
                            }`}
                          type={inputFields.password_confirm.type}
                          id="owisp-password-confirm-password-confirm"
                          required
                          name="newPassword2"
                          value={newPassword2}
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
                                inputFields.password_confirm
                                  .pattern_description,
                                language,
                              )
                              : undefined
                          }
                        />
                      </label>
                      {errors.newPassword2 && (
                        <div className="owisp-password-confirm-error owisp-password-confirm-error-confirm">
                          <span className="owisp-password-confirm-error-icon">
                            !
                        </span>
                          <span className="owisp-password-confirm-error-text owisp-password-confirm-error-text-confirm">
                            {errors.newPassword2}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
                <input
                  type="submit"
                  className="owisp-password-confirm-submit-btn"
                  value={getText(buttons.submit, language)}
                />
                {passwordConfirm.contact_text ? (
                  <div className="owisp-password-confirm-contact-us">
                    {getText(passwordConfirm.contact_text, language)}
                  </div>
                ) : null}
                {loginPageLink ? (
                  <Link
                    to={`/${orgSlug}/login`}
                    className="owisp-password-confirm-links"
                  >
                    {getText(loginPageLink.text, language)}
                  </Link>
                ) : null}
              </form>
            )}
        </div>
      </>
    );
  }
}
PasswordConfirm.contextType = LoadingContext;
PasswordConfirm.propTypes = {
  passwordConfirm: PropTypes.shape({
    heading: PropTypes.object,
    additional_text: PropTypes.object,
    input_fields: PropTypes.shape({
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
    buttons: PropTypes.object,
    login_page_link: PropTypes.object,
    contact_text: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      uid: PropTypes.string,
      token: PropTypes.string,
    }),
  }).isRequired,
};
