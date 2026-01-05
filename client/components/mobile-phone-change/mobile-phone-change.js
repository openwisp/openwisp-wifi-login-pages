import "./index.css";

import axios from "axios";
import PropTypes from "prop-types";
import qs from "qs";
import React, {Suspense} from "react";
import {Cookies} from "react-cookie";
import {Link, Navigate} from "react-router-dom";
import {toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {t} from "ttag";
import "react-phone-input-2/lib/style.css";
import LoadingContext from "../../utils/loading-context";
import {mobilePhoneChangeUrl} from "../../constants";
import getErrorText from "../../utils/get-error-text";
import logError from "../../utils/log-error";
import handleChange from "../../utils/handle-change";
import submitOnEnter from "../../utils/submit-on-enter";
import Contact from "../contact-box";
import validateToken from "../../utils/validate-token";
import getError from "../../utils/get-error";
import getLanguageHeaders from "../../utils/get-language-headers";

const PhoneInput = React.lazy(
  () => import(/* webpackChunkName: 'PhoneInput' */ "react-phone-input-2"),
);

class MobilePhoneChange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phoneNumber: "",
      errors: {},
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.abortController = null;
  }

  async componentDidMount() {
    this.abortController = new AbortController();
    const {setLoading} = this.context;
    const {cookies, orgSlug, setUserData, logout, setTitle, orgName, language} =
      this.props;
    setLoading(true);
    setTitle(t`PHONE_CHANGE_TITL`, orgName);
    let {userData} = this.props;
    const isValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    if (isValid && !this.abortController.signal.aborted) {
      ({userData} = this.props);
      const {phoneNumber} = userData;
      this.setState({phoneNumber});
    }
    setLoading(false);
  }

  componentWillUnmount() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    const {setLoading} = this.context;
    const {orgSlug, setUserData, userData, language, navigate} = this.props;
    const {phoneNumber, errors} = this.state;
    const url = mobilePhoneChangeUrl(orgSlug);
    this.setState({errors: {...errors, phoneNumber: ""}});
    setLoading(true);
    return axios({
      method: "post",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": getLanguageHeaders(language),
        Authorization: `Bearer ${userData.authToken}`,
      },
      url,
      data: qs.stringify({
        phoneNumber,
      }),
      signal: this.abortController.signal,
    })
      .then(() => {
        this.setState({
          errors: {},
        });
        setUserData({...userData, isVerified: false, phoneNumber});
        setLoading(false);
        toast.success(t`TOKEN_SENT`);
        navigate(`/${orgSlug}/mobile-phone-verification`);
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
            ...(data.phoneNumber ? {phoneNumber: data.phoneNumber} : null),
            ...(errorText ? {nonField: errorText} : {nonField: ""}),
          },
        });
      });
  }

  handleChange(event) {
    handleChange(event, this);
  }

  render() {
    const {phoneNumber, errors} = this.state;
    const {orgSlug, phoneNumberChange, settings, userData} = this.props;
    const {inputFields} = phoneNumberChange;

    if (
      !settings.mobilePhoneVerification ||
      (userData.method !== undefined && userData.method !== "mobile_phone")
    ) {
      return <Navigate push to={`/${orgSlug}/status`} />;
    }

    return (
      <div className="container content" id="mobile-phone-change">
        <div className="inner">
          <form
            className="main-column"
            id="mobile-phone-change-form"
            onSubmit={this.handleSubmit}
            aria-label="mobile phone change form"
          >
            <div className="inner">
              {getError(errors)}
              <div className="row phone-number">
                <label htmlFor="phone-number">{t`PHONE_LBL`}</label>
                {getError(errors, "phoneNumber")}
                <Suspense
                  fallback={
                    <input
                      name="phoneNumber"
                      className="form-control input"
                      value={phoneNumber}
                      onChange={(value) =>
                        this.handleChange({
                          target: {name: "phoneNumber", value: `+${value}`},
                        })
                      }
                      onKeyDown={(event) => {
                        submitOnEnter(event, this, "mobile-phone-change-form");
                      }}
                      placeholder={t`PHONE_PHOLD`}
                      id="phone-number"
                    />
                  }
                >
                  <PhoneInput
                    name="phoneNumber"
                    onlyCountries={inputFields.phoneNumber.only_countries || []}
                    preferredCountries={
                      inputFields.phoneNumber.preferred_countries || []
                    }
                    excludeCountries={inputFields.phoneNumber.exclude_countries || []}
                    value={phoneNumber}
                    onChange={(value) =>
                      this.handleChange({
                        target: {name: "phoneNumber", value: `+${value}`},
                      })
                    }
                    onKeyDown={(event) => {
                      submitOnEnter(event, this, "mobile-phone-change-form");
                    }}
                    placeholder={t`PHONE_PHOLD`}
                    enableSearch={Boolean(inputFields.phoneNumber.enable_search)}
                    inputProps={{
                      name: "phoneNumber",
                      id: "phone-number",
                      className: `form-control input ${
                        errors.phoneNumber ? "error" : ""
                      }`,
                      required: true,
                    }}
                  />
                </Suspense>
              </div>

              <div className="row submit">
                <input
                  type="submit"
                  className="button full"
                  value={t`PHONE_CHANGE_BTN`}
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
export default MobilePhoneChange;
MobilePhoneChange.contextType = LoadingContext;
MobilePhoneChange.propTypes = {
  phoneNumberChange: PropTypes.shape({
    inputFields: PropTypes.shape({
      phoneNumber: PropTypes.shape({
        only_countries: PropTypes.array,
        preferred_countries: PropTypes.array,
        exclude_countries: PropTypes.array,
        enable_search: PropTypes.bool,
      }),
    }).isRequired,
    buttons: PropTypes.shape({
      change_phoneNumber: PropTypes.bool,
      cancel: PropTypes.bool,
    }).isRequired,
  }).isRequired,
  settings: PropTypes.shape({
    mobilePhoneVerification: PropTypes.bool,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  logout: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  navigate: PropTypes.func.isRequired,
};
