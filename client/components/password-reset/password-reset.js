import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingContext from "../../utils/loading-context";
import {resetApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import Contact from "../contact-box";

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
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {orgSlug} = this.props;
    const {email, errors} = this.state;
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
      .then((response) => {
        this.setState({
          errors: {},
          email: "",
          success: response.data.detail,
        });
        setLoading(false);
        toast.success(response.data.detail);
      })
      .catch((error) => {
        const errorText = getErrorText(error);
        logError(error, errorText);
        setLoading(false);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(errorText ? {email: errorText} : {email: ""}),
          },
        });
      });
  }

  render() {
    const {email, errors, success} = this.state;
    const {language, passwordReset, orgSlug} = this.props;
    const inputFields = passwordReset.input_fields;
    const loginPageLink = passwordReset.login_page_link;
    const {buttons} = passwordReset;
    return (
      <div className="container content" id="reset-password">
        <div className="inner">
          {success ? (
            <div className="main-column">
              <div className="success">{success}</div>
              <Link to={`/${orgSlug}/login`} className="link">
                {getText(loginPageLink.text, language)}
              </Link>
            </div>
          ) : (
            <form className="main-column" onSubmit={this.handleSubmit}>
              <p className="label">
                {getText(passwordReset.additional_text, language)}
              </p>

              <div className="fieldset">
                <div className="row email">
                  <label htmlFor="email">
                    {getText(inputFields.email.label, language)}
                  </label>
                  {errors.email && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text email">{errors.email}</span>
                    </div>
                  )}
                  <input
                    className={`input ${errors.email ? "error" : ""}`}
                    type={inputFields.email.type}
                    id="email"
                    required
                    name="email"
                    value={email}
                    onChange={this.handleChange}
                    placeholder={getText(
                      inputFields.email.placeholder,
                      language,
                    )}
                    pattern={inputFields.email.pattern}
                    title={getText(inputFields.email.pattern_description)}
                  />
                </div>

                <div className="row submit">
                  <input
                    type="submit"
                    className="button full"
                    value={getText(buttons.send, language)}
                  />
                </div>
              </div>

              {passwordReset.contact_text && (
                <div className="row contact-us">
                  {getText(passwordReset.contact_text, language)}
                </div>
              )}

              {loginPageLink && (
                <div className="row links">
                  <Link to={`/${orgSlug}/login`} className="link">
                    {getText(loginPageLink.text, language)}
                  </Link>
                </div>
              )}
            </form>
          )}

          <Contact />
        </div>
      </div>
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
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
    buttons: PropTypes.object,
    login_page_link: PropTypes.object,
    contact_text: PropTypes.object,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
};
