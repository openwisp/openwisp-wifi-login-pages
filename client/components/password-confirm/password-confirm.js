import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import "react-toastify/dist/ReactToastify.css";
import Contact from "../contact-box";
import LoadingContext from "../../utils/loading-context";
import PasswordToggleIcon from "../../utils/password-toggle";

import {confirmApiUrl, passwordConfirmError} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";

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
    this.passwordToggleRef = React.createRef();
    this.confirmPasswordToggleRef = React.createRef();
  }

  componentDidMount() {
    const {setTitle, orgName} = this.props;
    setTitle(t`PASSWORD_CONFIRM_PAGE_TITLE`, orgName);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {passwordConfirm, orgSlug, match} = this.props;
    const inputFields = passwordConfirm.input_fields;
    const {newPassword1, newPassword2, errors} = this.state;
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
    this.setState({errors: {...errors, newPassword2: ""}});
    const url = confirmApiUrl.replace("{orgSlug}", orgSlug);
    const {uid, token} = match.params;
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
      .then((response) => {
        this.setState({
          errors: {},
          success: response.data.detail,
        });
        setLoading(false);
        toast.success(response.data.detail);
      })
      .catch((error) => {
        let errorText = getErrorText(error);
        if (!errorText && error.response.data.token[0]) {
          errorText = `token: ${error.response.data.token[0]}`;
        }
        logError(error, errorText);
        toast.error(errorText);
        setLoading(false);
        this.setState({
          success: false,
          errors: {
            ...errors,
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
          },
        });
      });
  }

  render() {
    const {newPassword1, newPassword2, errors, success} = this.state;
    const {passwordConfirm, orgSlug} = this.props;
    const inputFields = passwordConfirm.input_fields;
    const loginPageLink = passwordConfirm.login_page_link;
    return (
      <div className="container content" id="password-confirm">
        <div className="inner">
          {success ? (
            <div className="main-column">
              <div className="message-container">
                <div className="icon">
                  <div className="tick" />
                </div>
                <div className="success">{success}</div>
                <div className="row">
                  {loginPageLink && (
                    <Link to={`/${orgSlug}/login`} className="link">
                      {t`LOGIN_PAGE_LINK_TEXT`}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form className="main-column" onSubmit={this.handleSubmit}>
              <h1>{t`PASSWORD_CONFIRM_HEADING`}</h1>

              {passwordConfirm.additional_text && (
                <p>{t`PASSWORD_CONFIRM_ADDITIONAL_TEXT`}</p>
              )}

              <div className="fieldset">
                {errors.nonField && (
                  <div className="error non-field">
                    <span className="icon">!</span>
                    <span className="text">{errors.nonField}</span>
                  </div>
                )}

                <div className="row password">
                  <label htmlFor="password">{t`PASSWORD_LABEL`}</label>

                  {errors.newPassword1 && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text ">{errors.newPassword1}</span>
                    </div>
                  )}

                  <input
                    className={`input ${errors.newPassword1 ? "error" : ""}`}
                    type={inputFields.password.type}
                    id="password"
                    required
                    name="newPassword1"
                    value={newPassword1}
                    onChange={this.handleChange}
                    placeholder={t`PASSWORD_PLACEHOLDER`}
                    pattern={inputFields.password.pattern}
                    title={t`PASSWORD_PATTERN_DESCRIPTION`}
                    ref={this.passwordToggleRef}
                    autoComplete="new-password"
                  />
                  <PasswordToggleIcon inputRef={this.passwordToggleRef} />
                </div>

                <div className="row password-confirm">
                  <label htmlFor="password-confirm">
                    {t`CONFIRM_PASSWORD_LABEL`}
                  </label>

                  {errors.newPassword2 && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text ">{errors.newPassword2}</span>
                    </div>
                  )}

                  <input
                    className={`input ${errors.newPassword2 ? "error" : ""}`}
                    type={inputFields.password_confirm.type}
                    id="password-confirm"
                    required
                    name="newPassword2"
                    value={newPassword2}
                    onChange={this.handleChange}
                    placeholder={t`CONFIRM_PASSWORD_PLACEHOLDER`}
                    pattern={inputFields.password.pattern}
                    title={t`CONFIRM_PASSWORD_PATTERN_DESCRIPTION`}
                    ref={this.confirmPasswordToggleRef}
                    autoComplete="new-password"
                  />
                  <PasswordToggleIcon
                    inputRef={this.confirmPasswordToggleRef}
                  />
                </div>
              </div>

              <div className="row submit">
                <input
                  type="submit"
                  className="button full"
                  value={t`PASSWORD_CONFIRM_BUTTON`}
                />
              </div>

              {passwordConfirm.contact_text && (
                <div className="contact-us">
                  {t`PASSWORD_CONFIRM_CONTACT_TEXT`}
                </div>
              )}

              {loginPageLink && (
                <Link to={`/${orgSlug}/login`} className="link">
                  {t`LOGIN_PAGE_LINK_TEXT`}
                </Link>
              )}
            </form>
          )}

          <Contact />
        </div>
      </div>
    );
  }
}
PasswordConfirm.contextType = LoadingContext;
PasswordConfirm.propTypes = {
  passwordConfirm: PropTypes.shape({
    additional_text: PropTypes.bool,
    input_fields: PropTypes.shape({
      password: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string.isRequired,
      }),
      password_confirm: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }),
    login_page_link: PropTypes.bool,
    contact_text: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      uid: PropTypes.string,
      token: PropTypes.string,
    }),
  }).isRequired,
  setTitle: PropTypes.func.isRequired,
};
