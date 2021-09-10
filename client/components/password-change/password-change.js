import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {toast} from "react-toastify";
import {Cookies} from "react-cookie";
import {t} from "ttag";
import {Link, Redirect} from "react-router-dom";
import PasswordToggleIcon from "../../utils/password-toggle";
import {passwordChangeApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import history from "../../utils/history";
import Contact from "../contact-box";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import handleSession from "../../utils/session";
import validateToken from "../../utils/validate-token";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";

export default class PasswordChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPassword: "",
      newPassword1: "",
      newPassword2: "",
      errors: {},
      hidePassword: true,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.getPasswordField = this.getPasswordField.bind(this);
    this.currentPasswordToggleRef = React.createRef();
    this.passwordToggleRef = React.createRef();
    this.confirmPasswordToggleRef = React.createRef();
  }

  async componentDidMount() {
    const {setLoading} = this.context;
    const {setTitle, orgName, cookies, userData, setUserData, logout, orgSlug} =
      this.props;
    setLoading(true);
    setTitle(t`PWD_CHANGE_TITL`, orgName);
    await validateToken(cookies, orgSlug, setUserData, userData, logout);
    setLoading(false);
  }

  handleSubmit(e) {
    const {setLoading} = this.context;

    if (e) e.preventDefault();
    const {orgSlug, cookies, language} = this.props;
    const authToken = cookies.get(`${orgSlug}_auth_token`);
    const {token, session} = handleSession(orgSlug, authToken, cookies);
    const url = passwordChangeApiUrl.replace("{orgSlug}", orgSlug);
    const {currentPassword, newPassword1, newPassword2} = this.state;
    if (newPassword1 !== newPassword2) {
      this.setState({
        errors: {
          newPassword2: t`PWD_CNF_ERR`,
        },
      });
      return null;
    }
    if (currentPassword === newPassword1 || currentPassword === newPassword2) {
      this.setState({
        errors: {
          newPassword1: t`PWD_CURR_ERR`,
          newPassword2: t`PWD_CURR_ERR`,
        },
      });
      return null;
    }
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
      },
      url,
      data: qs.stringify({
        currentPassword,
        newPassword1,
        newPassword2,
        token,
        session,
      }),
    })
      .then((response) => {
        toast.success(response.data.message);
        setLoading(false);
        history.replace(`/${orgSlug}/status`);
      })
      .catch((error) => {
        const {data} = error.response;
        const errorText = getErrorText(error, t`PWD_CHNG_ERR`);
        logError(error, errorText);
        toast.error(errorText);
        setLoading(false);
        this.setState({
          errors: {
            ...(data.current_password
              ? {currentPassword: data.current_password.toString()}
              : {nonField: t`PWD_CHNG_ERR`}),
          },
        });
      });
  }

  handleChange(event) {
    handleChange(event, this);
  }

  getPasswordField = (props) => {
    const {
      id,
      labelText,
      name,
      value,
      placeholder,
      pattern,
      inputRef,
      secondInputRef,
      hidePassword,
      toggler,
    } = props;
    const {errors} = this.state;
    return (
      <div className={`row ${id}`}>
        <label htmlFor={id}>{labelText}</label>
        {getError(errors, name)}
        <input
          className="input"
          type="password"
          id={id}
          name={name}
          required
          value={value}
          placeholder={placeholder}
          pattern={pattern}
          title={t`PWD_PTRN_DESC`}
          onChange={(e) => this.handleChange(e)}
          ref={inputRef}
          autoComplete="password"
        />
        <PasswordToggleIcon
          {...{inputRef, secondInputRef, hidePassword, toggler}}
        />
      </div>
    );
  };

  render() {
    const {passwordChange, orgSlug, userData} = this.props;
    const {errors, newPassword1, newPassword2, hidePassword, currentPassword} =
      this.state;
    const toggler = () => this.setState({hidePassword: !hidePassword});
    if (userData && ["saml", "social_login"].includes(userData.method))
      return <Redirect to={`/${orgSlug}/status`} />;
    return (
      <div className="container content" id="password-change">
        <div className="inner">
          <form className="main-column" onSubmit={this.handleSubmit}>
            <div className="inner">
              <h1>{t`PWD_CHANGE_TITL`}</h1>
              {getError(errors)}

              {this.getPasswordField({
                id: "current-password",
                labelText: t`CURR_PWD_LBL`,
                name: "currentPassword",
                value: currentPassword,
                placeholder: t`CURR_PWD_PHOLD`,
                pattern: passwordChange.input_fields.password1.pattern,
                inputRef: this.currentPasswordToggleRef,
              })}

              {this.getPasswordField({
                id: "new-password",
                labelText: t`PWD1_LBL`,
                name: "newPassword1",
                value: newPassword1,
                placeholder: t`PWD1_PHOLD`,
                pattern: passwordChange.input_fields.password1.pattern,
                inputRef: this.passwordToggleRef,
                secondInputRef: this.confirmPasswordToggleRef,
                hidePassword,
                toggler,
              })}

              {this.getPasswordField({
                id: "password-confirm",
                labelText: t`CONFIRM_PWD_LBL`,
                name: "newPassword2",
                value: newPassword2,
                placeholder: t`CONFIRM_PWD_PHOLD`,
                pattern: passwordChange.input_fields.password1.pattern,
                inputRef: this.confirmPasswordToggleRef,
                secondInputRef: this.passwordToggleRef,
                hidePassword,
                toggler,
              })}

              <div className="row submit">
                <input
                  type="submit"
                  className="button full"
                  value={t`PASSWORD_CHANGE`}
                />
              </div>

              <div className="row cancel">
                <Link className="button full" to={`/${orgSlug}/status`}>
                  {t`CANCEL`}
                </Link>
              </div>
            </div>
          </form>

          <Contact />
        </div>
      </div>
    );
  }
}
PasswordChange.contextType = LoadingContext;
PasswordChange.propTypes = {
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  passwordChange: PropTypes.shape({
    input_fields: PropTypes.shape({
      password1: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
      password2: PropTypes.shape({
        pattern: PropTypes.string,
      }).isRequired,
    }),
  }).isRequired,
  setTitle: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
};
