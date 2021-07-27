import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import "react-toastify/dist/ReactToastify.css";
import LoadingContext from "../../utils/loading-context";
import {resetApiUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
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

  componentDidMount() {
    const {setTitle, orgName} = this.props;
    setTitle(t`PWD_RESET_TITL`, orgName);
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
    const {passwordReset, orgSlug} = this.props;
    const inputFields = passwordReset.input_fields;
    const loginPageLink = passwordReset.login_page_link;
    return (
      <div className="container content" id="reset-password">
        <div className="inner">
          {success ? (
            <div className="main-column">
              <div className="inner">
                <div className="success">{success}</div>
                <Link to={`/${orgSlug}/login`} className="link">
                  {t`LOGIN_PG_LNK`}
                </Link>
              </div>
            </div>
          ) : (
            <form className="main-column" onSubmit={this.handleSubmit}>
              <div className="inner">
                {passwordReset.additional_text && (
                  <p className="label">{t`PWD_RESET_ADD_TXT`}</p>
                )}

                <div className="fieldset">
                  <div className="row email">
                    <label htmlFor="email">{t`EMAIL`}</label>
                    {errors.email && (
                      <div className="error">
                        <span className="icon">!</span>
                        <span className="text email">{errors.email}</span>
                      </div>
                    )}
                    <input
                      className={`input ${errors.email ? "error" : ""}`}
                      type="email"
                      id="email"
                      required
                      name="email"
                      value={email}
                      onChange={this.handleChange}
                      placeholder={t`EMAIL_PHOLD`}
                      pattern={inputFields.email.pattern}
                      title={t`EMAIL_PTRN_DESC`}
                      autoComplete="email"
                    />
                  </div>

                  <div className="row submit">
                    <input
                      type="submit"
                      className="button full"
                      value={t`PWD_RESET_BTN`}
                    />
                  </div>
                </div>

                {passwordReset.contact_text && (
                  <div className="row contact-us">{t`PWD_RESET_CNTC_TXT`}</div>
                )}

                {loginPageLink && (
                  <div className="row links">
                    <Link to={`/${orgSlug}/login`} className="link">
                      {t`LOGIN_PG_LNK`}
                    </Link>
                  </div>
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
PasswordReset.contextType = LoadingContext;
PasswordReset.propTypes = {
  passwordReset: PropTypes.shape({
    additional_text: PropTypes.bool,
    input_fields: PropTypes.shape({
      email: PropTypes.shape({
        pattern: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    login_page_link: PropTypes.bool,
    contact_text: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  setTitle: PropTypes.func.isRequired,
};
