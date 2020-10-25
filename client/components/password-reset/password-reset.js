import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingContext from "../../utils/loading-context";
import { resetApiUrl } from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";

export default class PasswordReset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
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
    const { orgSlug } = this.props;
    const { email, errors } = this.state;
    const url = resetApiUrl.replace("{orgSlug}", orgSlug);
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        email,
      }),
    })
      .then(response => {
        this.setState({
          errors: {},
          email: "",
          success: response.data.detail,
        });
        setLoading(false);
        toast.success(response.data.detail);
      })
      .catch(error => {
        const errorText = getErrorText(error);
        logError(error, errorText);
        setLoading(false);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(errorText ? { email: errorText } : { email: "" }),
          },
        });
      });
  }

  render() {
    const { email, errors, success } = this.state;
    const { language, passwordReset, orgSlug } = this.props;
    const inputFields = passwordReset.input_fields;
    const loginPageLink = passwordReset.login_page_link;
    const { buttons } = passwordReset;
    return (
      <>
        <div className="owisp-password-reset-container">
          {success ? (
            <div className="owisp-password-reset-form">
              <div className="owisp-password-reset-success">{success}</div>
              <Link
                to={`/${orgSlug}/login`}
                className="owisp-password-reset-links"
              >
                {getText(loginPageLink.text, language)}
              </Link>
            </div>
          ) : (
              <form
                className="owisp-password-reset-form"
                onSubmit={this.handleSubmit}
              >
                <div className="owisp-password-reset-header">
                  <div className="owisp-password-reset-heading">
                    {getText(passwordReset.heading, language)}
                  </div>
                  <div className="owisp-password-reset-subheading">
                    {getText(passwordReset.additional_text, language)}
                  </div>
                </div>
                <div className="owisp-password-reset-fieldset">
                  {inputFields.email ? (
                    <>
                      <label
                        className="owisp-password-reset-label owisp-password-reset-label-email"
                        htmlFor="owisp-password-reset-email"
                      >
                        <div className="owisp-password-reset-label-text owisp-password-reset-label-text-email">
                          {getText(inputFields.email.label, language)}
                        </div>
                        <input
                          className={`owisp-password-reset-input owisp-password-reset-input-email ${
                            errors.email ? "error" : ""
                            }`}
                          type={inputFields.email.type}
                          id="owisp-password-reset-email"
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
                        <div className="owisp-password-reset-error owisp-password-reset-error-email">
                          <span className="owisp-password-reset-error-icon">
                            !
                        </span>
                          <span className="owisp-password-reset-error-text owisp-password-reset-error-text-email">
                            {errors.email}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
                <input
                  type="submit"
                  className="owisp-password-reset-send-btn owisp-btn-primary"
                  value={getText(buttons.send, language)}
                />
                {passwordReset.contact_text ? (
                  <div className="owisp-password-reset-contact-us">
                    {getText(passwordReset.contact_text, language)}
                  </div>
                ) : null}
                {loginPageLink ? (
                  <Link
                    to={`/${orgSlug}/login`}
                    className="owisp-password-reset-links"
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
PasswordReset.contextType = LoadingContext;
PasswordReset.propTypes = {
  passwordReset: PropTypes.shape({
    heading: PropTypes.object,
    additional_text: PropTypes.object,
    input_fields: PropTypes.shape({
      email: PropTypes.shape({
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
};
