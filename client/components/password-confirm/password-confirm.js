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

import {confirmApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";

export default class PasswordConfirm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newPassword1: "",
      newPassword2: "",
      errors: {},
      success: false,
      hidePassword: true,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.passwordToggleRef = React.createRef();
    this.confirmPasswordToggleRef = React.createRef();
  }

  componentDidMount() {
    const {setTitle, orgName} = this.props;
    setTitle(t`PWD_CONFIRM_TITL`, orgName);
  }

  handleChange(event) {
    handleChange(event, this);
  }

  handleSubmit(event) {
    const {setLoading} = this.context;
    event.preventDefault();
    const {passwordConfirm, orgSlug, match, language} = this.props;
    const inputFields = passwordConfirm.input_fields;
    const {newPassword1, newPassword2, errors} = this.state;
    if (inputFields.password_confirm) {
      if (newPassword1 !== newPassword2) {
        this.setState({
          errors: {
            newPassword2: t`PWD_CNF_ERR`,
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
        "accept-language": getLanguageHeaders(language),
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
    const {newPassword1, newPassword2, errors, success, hidePassword} =
      this.state;
    const {passwordConfirm, orgSlug} = this.props;
    const inputFields = passwordConfirm.input_fields;
    const loginPageLink = passwordConfirm.login_page_link;
    return (
      <div className="container content" id="password-confirm">
        <div className="inner">
          {success ? (
            <div className="main-column">
              <div className="inner">
                <div className="message-container">
                  <div className="icon">
                    <div className="tick" />
                  </div>
                  <div className="success">{success}</div>
                  <div className="row">
                    {loginPageLink && (
                      <Link to={`/${orgSlug}/login`} className="link">
                        {t`LOGIN_PG_LNK`}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="main-column" onSubmit={this.handleSubmit}>
              <div className="inner">
                <h1>{t`PWD_CONFIRM_H`}</h1>

                {passwordConfirm.additional_text && (
                  <p>{t`PWD_CONFIRM_ADD_TXT`}</p>
                )}

                <div className="fieldset">
                  {getError(errors)}

                  <div className="row password">
                    <label htmlFor="password">{t`PWD_LBL`}</label>
                    {getError(errors, "newPassword1")}

                    <input
                      className={`input ${errors.newPassword1 ? "error" : ""}`}
                      type="password"
                      id="password"
                      required
                      name="newPassword1"
                      value={newPassword1}
                      onChange={this.handleChange}
                      placeholder={t`PWD_PHOLD`}
                      pattern={inputFields.password.pattern}
                      title={t`PWD_PTRN_DESC`}
                      ref={this.passwordToggleRef}
                      autoComplete="new-password"
                    />
                    <PasswordToggleIcon
                      inputRef={this.passwordToggleRef}
                      secondInputRef={this.confirmPasswordToggleRef}
                      hidePassword={hidePassword}
                      toggler={() =>
                        this.setState({hidePassword: !hidePassword})
                      }
                    />
                  </div>

                  <div className="row password-confirm">
                    <label htmlFor="password-confirm">{t`CONFIRM_PWD_LBL`}</label>
                    {getError(errors, "newPassword2")}

                    <input
                      className={`input ${errors.newPassword2 ? "error" : ""}`}
                      type="password"
                      id="password-confirm"
                      required
                      name="newPassword2"
                      value={newPassword2}
                      onChange={this.handleChange}
                      placeholder={t`CONFIRM_PWD_PHOLD`}
                      pattern={inputFields.password.pattern}
                      title={t`PWD_PTRN_DESC`}
                      ref={this.confirmPasswordToggleRef}
                      autoComplete="new-password"
                    />
                    <PasswordToggleIcon
                      inputRef={this.confirmPasswordToggleRef}
                      secondInputRef={this.passwordToggleRef}
                      hidePassword={hidePassword}
                      toggler={() =>
                        this.setState({hidePassword: !hidePassword})
                      }
                    />
                  </div>
                </div>

                <div className="row submit">
                  <input
                    type="submit"
                    className="button full"
                    value={t`PWD_CONFIRM`}
                  />
                </div>

                {passwordConfirm.contact_text && (
                  <div className="contact-us">{t`PWD_RESET_CNTC_TXT`}</div>
                )}

                {loginPageLink && (
                  <Link to={`/${orgSlug}/login`} className="link">
                    {t`LOGIN_PG_LNK`}
                  </Link>
                )}
              </div>
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
        pattern: PropTypes.string.isRequired,
      }),
      password_confirm: PropTypes.shape({
        pattern: PropTypes.string,
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
  language: PropTypes.string.isRequired,
};
