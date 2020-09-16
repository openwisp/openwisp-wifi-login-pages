/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import { Link, Route } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { loginApiUrl, loginError, loginSuccess, mainToastId } from "../../constants";
import getAssetPath from "../../utils/get-asset-path";
import getErrorText from "../../utils/get-error-text";
import getParameterByName from "../../utils/get-parameter-by-name";
import getText from "../../utils/get-text";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import renderAdditionalInfo from "../../utils/render-additional-info";
import Contact from "../contact-box";
import Modal from "../modal";

export default class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      errors: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const email = getParameterByName("email");
    const token = getParameterByName("token");
    if (email && token) {
      this.setState(
        {
          email,
          password: token,
        },
        () => {
          this.handleSubmit();
        },
      );
    }
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleSubmit(event) {
    const { setLoading } = this.context;
    if (event) event.preventDefault();
    const { orgSlug, authenticate } = this.props;
    const { email, password, errors } = this.state;
    const url = loginApiUrl(orgSlug);
    this.setState({
      errors: {},
    });
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        "username": email,
        password,
      }),
    })
      .then(() => {
        authenticate(true);
        toast.success(loginSuccess, {
          toastId: mainToastId
        });
        setLoading(false);
      })
      .catch(error => {
        const { data } = error.response;
        const errorText = getErrorText(error, loginError);
        logError(error, errorText);
        toast.error(errorText);
        this.setState({
          errors: {
            ...errors,
            ...(data.email ? { email: data.email.toString() } : { email: "" }),
            ...(data.password ? { password: data.password } : { password: "" }),
          },
        });
        setLoading(false);
      });
  }

  render() {
    const { errors, email, password } = this.state;
    const {
      language,
      loginForm,
      orgSlug,
      termsAndConditions,
      privacyPolicy,
      match,
    } = this.props;
    const {
      links,
      buttons,
      input_fields,
      social_login,
      additional_info_text,
    } = loginForm;
    return (
      <>
        <div className="owisp-login-container">
          <div className="owisp-login-container-inner">
            <form className="owisp-login-form" onSubmit={this.handleSubmit}>
              {social_login ? (
                <>
                  {social_login.links.length ? (
                    <>
                      <div className="owisp-login-social-links-div">
                        {social_login.links.map(link => {
                          if (link.url)
                            return (
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="owisp-login-social-link owisp-btn-primary"
                                key={link.url}
                              >
                                <div>
                                  {link.icon ? (
                                    <img
                                      src={getAssetPath(orgSlug, link.icon)}
                                      alt={
                                        link.text
                                          ? getText(link.text, language)
                                          : link.url
                                      }
                                      className="owisp-login-social-link-icon"
                                    />
                                  ) : null}
                                  {link.text ? (
                                    <div className="owisp-login-social-link-text">
                                      {getText(link.text, language)}
                                    </div>
                                  ) : null}
                                </div>
                              </a>
                            );
                          return null;
                        })}
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
              <div className="owisp-login-fieldset">
                {errors.nonField && (
                  <div className="owisp-login-error owisp-login-error-non-field">
                    <span className="owisp-login-error-icon">!</span>
                    <span className="owisp-login-error-text owisp-login-error-text-non-field">
                      {errors.nonField}
                    </span>
                  </div>
                )}
                {input_fields.email ? (
                  <>
                    <label
                      className="owisp-login-label owisp-login-label-email"
                      htmlFor="owisp-login-email"
                    >
                      <div className="owisp-login-label-text">
                        {getText(input_fields.email.label, language)}
                      </div>
                      <input
                        className={`owisp-login-input
                        owisp-login-input-email
                        ${errors.email ? "error" : ""}`}
                        type={input_fields.email.type}
                        id="owisp-login-email"
                        name="email"
                        value={email}
                        onChange={this.handleChange}
                        required
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
                      <div className="owisp-login-error owisp-login-error-email">
                        <span className="owisp-login-error-icon">!</span>
                        <span className="owisp-login-error-text owisp-login-error-text-email">
                          {errors.email}
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
                {input_fields.password ? (
                  <>
                    <label
                      className="owisp-login-label owisp-login-label-password"
                      htmlFor="owisp-login-password"
                    >
                      <div className="owisp-login-label-text">
                        {getText(input_fields.password.label, language)}
                      </div>
                      <input
                        className={`owisp-login-input owisp-login-input-password
                      ${errors.password1 ? "error" : ""}`}
                        type={input_fields.password.type}
                        id="owisp-login-password"
                        required
                        name="password"
                        value={password}
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
                    {errors.password && (
                      <div className="owisp-login-error owisp-login-error-password">
                        <span className="owisp-login-error-icon">!</span>
                        <span className="owisp-login-error-text owisp-login-error-text-password">
                          {errors.password1}
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              {additional_info_text ? (
                <div className="owisp-login-add-info">
                  {renderAdditionalInfo(
                    additional_info_text,
                    language,
                    termsAndConditions,
                    privacyPolicy,
                    orgSlug,
                    "login",
                  )}
                </div>
              ) : null}
              {buttons.login ? (
                <>
                  {buttons.login.label ? (
                    <label
                      className="owisp-login-label owisp-login-label-login-btn"
                      htmlFor="owisp-login-login-btn"
                    >
                      <div className="owisp-login-label-text">
                        {getText(buttons.login.label, language)}
                      </div>
                    </label>
                  ) : null}
                  <input
                    type="submit"
                    className="owisp-login-form-btn owisp-login-login-btn owisp-btn-primary"
                    id="owisp-login-login-btn"
                    value={getText(buttons.login.text, language)}
                  />
                </>
              ) : null}
              {buttons.login ? (
                <>
                  {buttons.register.label ? (
                    <label
                      className="owisp-login-label owisp-login-label-register-btn"
                      htmlFor="owisp-login-register-btn"
                    >
                      <div className="owisp-login-label-text">
                        {getText(buttons.register.label, language)}
                      </div>
                    </label>
                  ) : null}
                  <div className="owisp-login-form-register-btn-div">
                    <Link
                      to={`/${orgSlug}/registration`}
                      className="owisp-login-form-btn owisp-login-register-btn owisp-btn-primary"
                    >
                      {getText(buttons.register.text, language)}
                    </Link>
                  </div>
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
                </div>
              ) : null}
            </form>
            <div className="owisp-login-contact-container">
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

Login.contextType = LoadingContext;
Login.propTypes = {
  loginForm: PropTypes.shape({
    social_login: PropTypes.shape({
      divider_text: PropTypes.object,
      description: PropTypes.object,
      links: PropTypes.arrayOf(PropTypes.object),
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
    }),
    additional_info_text: PropTypes.object,
    buttons: PropTypes.object,
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
