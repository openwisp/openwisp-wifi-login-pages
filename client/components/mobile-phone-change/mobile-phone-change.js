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
import {t} from "ttag";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";
import {mobilePhoneChangeUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import Contact from "../contact-box";
import handleSession from "../../utils/session";
import validateToken from "../../utils/validate-token";

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
    const {cookies, orgSlug, setUserData, logout, setTitle, orgName} =
      this.props;
    setTitle(t`PHONE_CHANGE_TITL`, orgName);
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
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    const {setLoading} = this.context;
    const {cookies, orgSlug, setUserData, userData} = this.props;
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
        setUserData({...userData, is_verified: false, phone_number});
        setLoading(false);
        toast.info(t`TOKEN_SENT`);
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
    const {orgSlug, phone_number_change, settings} = this.props;
    const {input_fields} = phone_number_change;

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
            <div className="inner">
              <div className="fieldset row">
                {errors.nonField && (
                  <div className="error non-field">
                    <span className="icon">!</span>
                    <span className="text">{errors.nonField}</span>
                  </div>
                )}

                <div className="row phone-number">
                  <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
                  {errors.phone_number && (
                    <div className="error">
                      <span className="icon">!</span>
                      <span className="text">{errors.phone_number}</span>
                    </div>
                  )}
                  <PhoneInput
                    name="phone_number"
                    onlyCountries={
                      input_fields.phone_number.only_countries || []
                    }
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
                    placeholder={t`PHONE_PHOLD`}
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
                  value={t`PHONE_CHANGE_BTN`}
                />

                <div className="row cancel">
                  <a
                    className="button full"
                    href={`/${orgSlug}/mobile-phone-verification`}
                  >
                    {t`CANCEL`}
                  </a>
                </div>
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
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
    }).isRequired,
    buttons: PropTypes.shape({
      change_phone_number: PropTypes.bool,
      cancel: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  settings: PropTypes.shape({
    mobile_phone_verification: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
};
