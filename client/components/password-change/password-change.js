import "react-toastify/dist/ReactToastify.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {toast} from "react-toastify";
import {
  passwordChangeApiUrl,
  passwordChangeError,
  passwordConfirmError,
} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import history from "../../utils/history";
import Contact from "../contact-box";
import LoadingContext from "../../utils/loading-context";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";

export default class PasswordChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newPassword1: "",
      newPassword2: "",
      errors: {},
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    const {setLoading} = this.context;

    if (e) e.preventDefault();
    const {orgSlug} = this.props;
    const url = passwordChangeApiUrl.replace("{orgSlug}", orgSlug);
    const {newPassword1, newPassword2} = this.state;
    if (newPassword1 !== newPassword2) {
      this.setState({
        errors: {
          newPassword2: passwordConfirmError,
        },
      });
      return null;
    }
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        newPassword1,
        newPassword2,
      }),
    })
      .then(response => {
        toast.success(response.data.detail);
        setLoading(false);
        history.replace(`/${orgSlug}/status`);
      })
      .catch(error => {
        const errorText = getErrorText(error, passwordChangeError);
        logError(error, errorText);
        toast.error(errorText);
        setLoading(false);
        this.setState({
          errors: {
            nonField: passwordChangeError,
          },
        });
      });
  }

  handleChange(event) {
    handleChange(event, this);
  }

  render() {
    const {language, passwordChange} = this.props;
    const {errors, newPassword1, newPassword2} = this.state;
    return (
      <div className="container content" id="password-change">
        <div className="inner">
          <form className="main-column" onSubmit={this.handleSubmit}>
            <h1>
              {getText(passwordChange.title, language)}
            </h1>

            {errors.nonField && (
              <div className="error">
                <span className="icon">!</span>
                <span className="text">
                  {errors.nonField}
                </span>
              </div>
            )}

            <div className="row password">
              <label htmlFor="password">
                {getText(passwordChange.input_fields.password1.label, language)}
              </label>

              {errors.newPassword1 && (
                <div className="error">
                  <span className="icon">!</span>
                  <span className="text">
                    {errors.newPassword1}
                  </span>
                </div>
              )}

              <input
                className="input"
                type="password"
                id="password"
                name="newPassword1"
                required
                value={newPassword1}
                placeholder={getText(
                  passwordChange.input_fields.password1.placeholder,
                  language,
                )}
                pattern={passwordChange.input_fields.password1.pattern}
                title={getText(passwordChange.input_fields.password1.pattern_description)}
                onChange={e => this.handleChange(e)}
              />
            </div>

            <div className="row password-confirm">
              <label htmlFor="password-confirm">
                {getText(
                  passwordChange.input_fields.password2.label,
                  language,
                )}
              </label>

              {errors.newPassword2 && (
                <div className="error">
                  <span className="icon">!</span>
                  <span className="text">
                    {errors.newPassword2}
                  </span>
                </div>
              )}

              <input
                className="input"
                type="password"
                name="newPassword2"
                id="password-confirm"
                required
                value={newPassword2}
                placeholder={getText(
                  passwordChange.input_fields.password2.placeholder,
                  language,
                )}
                pattern={passwordChange.input_fields.password1.pattern}
                title={getText(passwordChange.input_fields.password1.pattern_description)}
                onChange={e => this.handleChange(e)}
              />
            </div>

            <div className="row submit">
              <input
                type="submit"
                className="button full"
                value={getText(
                  passwordChange.buttons.submit_button.text,
                  language,
                )}
              />
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
  language: PropTypes.string.isRequired,
  passwordChange: PropTypes.shape({
    title: PropTypes.object,
    input_fields: PropTypes.shape({
      password1: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string.isRequired,
        pattern_description: PropTypes.object.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
      }).isRequired,
      password2: PropTypes.shape({
        type: PropTypes.string.isRequired.isRequired,
        label: PropTypes.object.isRequired,
        placeholder: PropTypes.object.isRequired,
      }).isRequired,
    }),
    buttons: PropTypes.shape({
      submit_button: PropTypes.shape({
        text: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
