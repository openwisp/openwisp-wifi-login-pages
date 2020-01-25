import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";

import { passwordChangeApiUrl, passwordConfirmError } from "../../constants";
import getText from "../../utils/get-text";
import history from "../../utils/history";

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
    if (e) e.preventDefault();
    const { orgSlug } = this.props;
    const url = passwordChangeApiUrl.replace("{orgSlug}", orgSlug);
    const { newPassword1, newPassword2 } = this.state;
    if (newPassword1 !== newPassword2) {
      this.setState({
        errors: {
          newPassword2: passwordConfirmError,
        },
      });
      return null;
    }

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
    }).then(() => {
      history.replace(`/${orgSlug}/status`);
    }).catch(() => {
      this.setState({
        errors: {
          nonField: `Some error occured. Couldn't change password!`,
        },
      });
    });
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  render() {
    const { language, passwordChange } = this.props;
    const { errors, newPassword1, newPassword2 } = this.state;
    return (
      <div className="owisp-password-change-container">
        <form className="owisp-password-change-form" onSubmit={this.handleSubmit}>
          <div className="owisp-password-change-form-title">{getText(passwordChange.title, language)}</div>
          {passwordChange.input_fields.password1 ?
            <>
              <label className="owisp-password-change-label owisp-password-change-label-password"
                htmlFor='owisp-password-change-password'
              >
                <div className='owisp-password-change-label-text'>
                  {getText(passwordChange.input_fields.password1.label, language)}
                </div>
                <input
                  className="owisp-password-change-input owisp-password-change-input-password"
                  type="password"
                  id='owisp-password-change-password'
                  name="newPassword1"
                  required
                  value={newPassword1}
                  placeholder={getText(
                    passwordChange.input_fields.password1.placeholder,
                    language,
                  )}
                  pattern={
                    passwordChange.input_fields.password1.pattern
                      ? passwordChange.input_fields.password1.pattern
                      : undefined
                  }
                  onChange={e => this.handleChange(e)}
                />
              </label>
              {errors.newPassword1 ?
                <div className="owisp-password-change-error">
                  <span className='owisp-password-change-error-icon'>!</span>
                  <span className='owisp-password-change-error-text'>
                    {errors.newPassword1}
                  </span>
                </div>
                : null}
            </> : null}
          {passwordChange.input_fields.password2 ?
            <>
              <label className="owisp-password-change-label owisp-password-change-label-password-confirm"
                htmlFor='owisp-password-change-password-confirm'
              >
                <div className='owisp-password-change-label-text'>
                  {getText(passwordChange.input_fields.password1.label, language)}
                </div>
                <input
                  className="owisp-password-change-input owisp-password-change-input-password-confirm"
                  type="password"
                  name="newPassword2"
                  id='owisp-password-change-password-confirm'
                  required
                  value={newPassword2}
                  placeholder={getText(
                    passwordChange.input_fields.password2.placeholder,
                    language,
                  )}
                  title={
                    passwordChange.input_fields.password1.pattern_description
                      ? getText(
                        passwordChange.input_fields.password1
                          .pattern_description,
                        language,
                      )
                      : undefined
                  }
                  onChange={e => this.handleChange(e)}
                />
              </label>
              {errors.newPassword2 ?
                <div className="owisp-password-change-error">
                  <span className='owisp-password-change-error-icon'>!</span>
                  <span className='owisp-password-change-error-text'>
                    {errors.newPassword2}
                  </span>
                </div>
                : null}
            </> : null}
          {errors.nonField ?
            <div className="owisp-password-change-error">
              <span className='owisp-password-change-error-icon'>!</span>
              <span className='owisp-password-change-error-text'>
                {errors.nonField}
              </span>
            </div>
            : null}
          <input
            type='submit'
            className="owisp-password-change-btn owisp-password-change-btn-submit"
            value={getText(passwordChange.buttons.submit_button.text, language)}
            pattern={
              passwordChange.input_fields.password2.pattern
                ? passwordChange.input_fields.password2.pattern
                : undefined
            }
            title={
              passwordChange.input_fields.password2.pattern_description
                ? getText(
                  passwordChange.input_fields.password2
                    .pattern_description,
                  language,
                )
                : undefined
            }
          />
        </form>
      </div>
    );
  }
}

PasswordChange.propTypes = {
  orgSlug: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  passwordChange: PropTypes.shape({
    title: PropTypes.object,
    input_fields: PropTypes.shape({
      password1: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string,
        pattern_description: PropTypes.string,
        label: PropTypes.string,
        placeholder: PropTypes.string.isRequired,
      }).isRequired,
      password2: PropTypes.shape({
        type: PropTypes.string.isRequired,
        pattern: PropTypes.string,
        pattern_description: PropTypes.string,
        label: PropTypes.string,
        placeholder: PropTypes.string.isRequired,
      }).isRequired,
    }),
    buttons: PropTypes.shape({
      submit_button: PropTypes.shape({
        text: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
