/* eslint-disable camelcase */
import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React from "react";
import {Cookies} from "react-cookie";
import {Redirect, withRouter} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";
import {mobilePhoneChangeUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import getText from "../../utils/get-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import Contact from "../contact-box";
import handleSession from "../../utils/session";
import validateToken from "../../utils/validateToken";

class MobilePhoneChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phone_number: "",
      errors: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async componentDidMount() {
    const {
      cookies,
      orgSlug,
      verifyMobileNumber,
      setUserData,
      logout,
    } = this.props;
    let {userData} = this.props;
    const isValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );
    if (isValid) {
      ({userData} = this.props);
      const {phone_number} = userData;
      this.setState({phone_number});
      verifyMobileNumber(true);
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    const {setLoading} = this.context;
    const {
      cookies,
      orgSlug,
      language,
      phone_number_change,
      setUserData,
    } = this.props;
    const {text} = phone_number_change;
    const {phone_number, errors} = this.state;
    const url = mobilePhoneChangeUrl(orgSlug);
    const auth_token = cookies.get(`${orgSlug}_auth_token`);
    const {token, session} = handleSession(orgSlug, auth_token, cookies);
    const self = this;
    this.setState({errors: {...errors, phone_number: ""}});
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      url,
      data: qs.stringify({
        phone_number,
        token,
        session,
      }),
    })
      .then(() => {
        this.setState({
          errors: {},
        });
        setUserData({});
        setLoading(false);
        toast.info(getText(text.token_sent, language));
        self.props.history.push(`/${orgSlug}/mobile-phone-verification`);
      })
      .catch((error) => {
        const {data} = error.response;
        const errorText = getErrorText(error);
        if (errorText) {
          logError(error, errorText);
          toast.error(errorText);
        }
        setLoading(false);
        this.setState({
          errors: {
            ...errors,
            ...(data.phone_number ? {phone_number: data.phone_number} : null),
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
          },
        });
      });
  }

  handleChange(event) {
    handleChange(event, this);
  }

  render() {
    const {phone_number, errors} = this.state;
    const {orgSlug, language, phone_number_change, settings} = this.props;
    const {input_fields} = phone_number_change;
    const {buttons} = phone_number_change;

    // check equality to false, it may be undefined
    if (!settings.mobile_phone_verification) {
      return <Redirect to={`/${orgSlug}/status`} />;
    }

    return (
      <div className="container content" id="mobile-phone-change">
        <div className="inner">
          <form
            className="main-column"
            id="mobile-phone-change-form"
            onSubmit={this.handleSubmit}
          >
            <div className="fieldset row">
              {errors.nonField && (
                <div className="error non-field">
                  <span className="icon">!</span>
                  <span className="text">{errors.nonField}</span>
                </div>
              )}

              <div className="row phone-number">
                <label htmlFor="phone-number">
                  {getText(input_fields.phone_number.label, language)}
                </label>
                {errors.phone_number && (
                  <div className="error">
                    <span className="icon">!</span>
                    <span className="text">{errors.phone_number}</span>
                  </div>
                )}
                <PhoneInput
                  name="phone_number"
                  onlyCountries={input_fields.phone_number.only_countries || []}
                  preferredCountries={
                    input_fields.phone_number.preferred_countries || []
                  }
                  excludeCountries={
                    input_fields.phone_number.exclude_countries || []
                  }
                  value={phone_number}
                  onChange={(value) =>
                    this.handleChange({
                      target: {name: "phone_number", value: `+${value}`},
                    })
                  }
                  onKeyDown={(event) => {
                    submitOnEnter(event, this, "mobile-phone-change-form");
                  }}
                  placeholder={getText(
                    input_fields.phone_number.placeholder,
                    language,
                  )}
                  enableSearch={Boolean(
                    input_fields.phone_number.enable_search,
                  )}
                  inputProps={{
                    name: "phone_number",
                    id: "phone-number",
                    className: `form-control input ${
                      errors.phone_number ? "error" : ""
                    }`,
                    required: true,
                  }}
                />
              </div>

              <input
                type="submit"
                className="button full"
                value={getText(buttons.change_phone_number.text, language)}
              />

              <div className="row cancel">
                <a
                  className="button full"
                  href={`/${orgSlug}/mobile-phone-verification`}
                >
                  {getText(buttons.cancel.text, language)}
                </a>
              </div>
            </div>
          </form>

          <Contact />
        </div>
      </div>
    );
  }
}
export default withRouter(MobilePhoneChange);
MobilePhoneChange.contextType = LoadingContext;
MobilePhoneChange.propTypes = {
  phone_number_change: PropTypes.shape({
    input_fields: PropTypes.shape({
      phone_number: PropTypes.shape({
        label: PropTypes.object,
        placeholder: PropTypes.object,
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
    }).isRequired,
    buttons: PropTypes.shape({
      change_phone_number: PropTypes.shape({
        text: PropTypes.object,
      }),
      cancel: PropTypes.shape({
        text: PropTypes.object,
      }),
    }).isRequired,
    text: PropTypes.shape({
      token_sent: PropTypes.shape().isRequired,
    }).isRequired,
  }).isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  verifyMobileNumber: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
};
