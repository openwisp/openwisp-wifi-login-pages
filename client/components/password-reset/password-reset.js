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
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";

export default class PasswordReset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: "",
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
    const {orgSlug, language} = this.props;
    const {input, errors} = this.state;
    const url = resetApiUrl.replace("{orgSlug}", orgSlug);
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
      },
      url,
      data: qs.stringify({
        input,
      }),
    })
      .then((response) => {
        this.setState({
          errors: {},
          input: "",
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
            ...(errorText ? {input: errorText} : {input: ""}),
          },
        });
      });
  }

  render() {
    const {input, errors, success} = this.state;
    const {passwordReset, orgSlug} = this.props;
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
                  <div className="row">
                    <label htmlFor="input">{t`USERNAME_LOG_LBL`}</label>
                    {getError(errors, "input")}
                    <input
                      className={`input ${errors.input ? "error" : ""}`}
                      type="text"
                      id="input"
                      required
                      name="input"
                      value={input}
                      onChange={this.handleChange}
                      placeholder={t`USERNAME_LOG_PHOLD`}
                      title={t`USERNAME_LOG_TITL`}
                      autoComplete="input"
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
    login_page_link: PropTypes.bool,
    contact_text: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  setTitle: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
};
