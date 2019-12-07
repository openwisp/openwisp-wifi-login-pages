import "./index.css";
import React from "react";
import axios from "axios";
import qs from "qs";
import PropTypes from "prop-types";

import {passwordConfirmError, passwordChangeApiUrl} from "../../constants";

import getText from "../../utils/get-text";

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
    }).catch(error => console.log(error));
  }

  handleChange(e) {
    this.setState({[e.target.name]: e.target.value});
  }

  render() {
    const {language, passwordChange} = this.props;
    const {errors} = this.state;
    return (
      <div className="owisp-passchange-page">
        <div className="owisp-passchange-container">
          <div className="title">{getText(passwordChange.title, language)}</div>
          <div className="owisp-passchange-label">
            {getText(passwordChange.input_fields.password1.label, language)}
          </div>
          <input
            className="owisp-passchange-input"
            style={{marginTop: "1rem"}}
            type="password"
            name="newPassword1"
            placeholder={getText(
              passwordChange.input_fields.password1.placeholder,
              language,
            )}
            onChange={e => this.handleChange(e)}
          />
          <div className="owisp-passchange-label">
            {getText(passwordChange.input_fields.password1.label, language)}
          </div>
          <input
            className="owisp-passchange-input"
            type="password"
            name="newPassword2"
            placeholder={getText(
              passwordChange.input_fields.password2.placeholder,
              language,
            )}
            onChange={e => this.handleChange(e)}
          />
          <div className="owisp-passchange-error">
            {errors.newPassword2 ? errors.newPassword2 : null}
          </div>
          <div
            className="owisp-passchange-submit"
            tabIndex="0"
            role="button"
            onClick={() => this.handleSubmit()}
            onKeyDown={() => this.handleSubmit()}
          >
            {getText(passwordChange.buttons.submit_button.text, language)}
          </div>
        </div>
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
