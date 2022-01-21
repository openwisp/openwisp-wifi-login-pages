/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Link, Redirect} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import Contact from "../contact-box";
import validateToken from "../../utils/validate-token";
import handleLogout from "../../utils/handle-logout";

export default class PaymentStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isTokenValid: null,
    };
  }

  async componentDidMount() {
    const {cookies, orgSlug, setUserData, logout, status, settings, language} =
      this.props;
    let {userData} = this.props;
    const {setLoading} = this.context;

    setLoading(true);
    const isTokenValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
      language,
    );
    setLoading(false);
    this.setState({isTokenValid});
    if (isTokenValid === false) {
      return;
    }

    ({userData} = this.props);
    const {method, is_verified: isVerified} = userData;
    // flag user to repeat login in order to restart session with new radius group
    if (status === "success" && method === "bank_card" && isVerified === true) {
      setUserData({
        ...userData,
        mustLogin: !settings.payment_requires_internet,
        mustLogout: settings.payment_requires_internet,
        repeatLogin: settings.payment_requires_internet,
      });
    } else if (
      status === "draft" &&
      method === "bank_card" &&
      isVerified === false
    ) {
      setUserData({
        ...userData,
        mustLogin: settings.payment_requires_internet ? true : undefined,
      });
    }
  }

  logout = () => {
    const {logout, cookies, orgSlug, setUserData, userData} = this.props;
    handleLogout(logout, cookies, orgSlug, setUserData, userData);
  };

  render() {
    const {orgSlug, status, isAuthenticated, userData} = this.props;
    const {method, is_verified: isVerified} = userData;
    const redirectToStatus = () => <Redirect to={`/${orgSlug}/status`} />;
    const acceptedValues = ["success", "failed", "draft"];
    const {isTokenValid} = this.state;

    // not registered with bank card flow
    if (
      (method && method !== "bank_card") ||
      !acceptedValues.includes(status)
    ) {
      return redirectToStatus();
    }

    // likely somebody opening this page by mistake
    if (
      (isAuthenticated === false && status !== "draft") ||
      (["failed", "draft"].includes(status) && isVerified === true) ||
      (status === "success" && isVerified === false) ||
      isTokenValid === false
    ) {
      return redirectToStatus();
    }

    // draft case
    // if (isAuthenticated === false && status === "draft") {
    if (status === "draft") {
      return this.renderDraft();
    }

    // success case
    if (isTokenValid === true && status === "success" && isVerified === true) {
      toast.success(t`PAY_SUCCESS`);
      return redirectToStatus();
    }

    return this.renderFailed();
  }

  renderDraft() {
    const {orgSlug, authenticate, page = {}, settings} = this.props;
    const {timeout = 5, max_attempts: maxAttempts = 3} = page;
    const payProceedUrl = settings.payment_requires_internet
      ? `/${orgSlug}/status`
      : `/${orgSlug}/payment/process`;

    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column single">
            <div className="inner">
              <h2 className="row">{t`PAY_REQ`}</h2>

              <div
                className="row"
                dangerouslySetInnerHTML={{
                  __html: t`PAY_WARN${timeout}${maxAttempts}`,
                }}
              />

              <div className="row">
                <Link
                  className="button full"
                  to={payProceedUrl}
                  onClick={() => authenticate(true)}
                >
                  {t`PAY_PROC_BTN`}
                </Link>
              </div>

              <div className="row">
                <button
                  type="button"
                  className="button full"
                  onClick={this.logout}
                >
                  {t`PAY_GIVE_UP_BTN`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderFailed() {
    const {orgSlug} = this.props;
    // failed payment case
    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <h2 className="row payment-status-row-1">{t`PAY_FAIL`}</h2>
              <div className="row payment-status-row-2">{t`PAY_SUB_H`}</div>
              <div className="row payment-status-row-3">
                <Link className="button full" to={`/${orgSlug}/payment/draft`}>
                  {t`PAY_TRY_AGAIN_BTN`}
                </Link>
              </div>

              <div className="row payment-status-row-4">
                <p>{t`PAY_GIVE_UP_TXT`}</p>
                <button
                  type="button"
                  className="button full"
                  onClick={this.logout}
                >
                  {t`PAY_GIVE_UP_BTN`}
                </button>
              </div>
            </div>
          </div>

          <Contact />
        </div>
      </div>
    );
  }
}
PaymentStatus.contextType = LoadingContext;
PaymentStatus.propTypes = {
  language: PropTypes.string,
  orgSlug: PropTypes.string,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  authenticate: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  page: PropTypes.object,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  settings: PropTypes.shape({
    payment_requires_internet: PropTypes.bool,
  }).isRequired,
};
