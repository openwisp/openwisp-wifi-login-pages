/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Link, Navigate} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import Loader from "../../utils/loader";
import Contact from "../contact-box";
import validateToken from "../../utils/validate-token";
import handleLogout from "../../utils/handle-logout";

export default class PaymentStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isTokenValid: null,
    };
    this.paymentProceedHandler = this.paymentProceedHandler.bind(this);
  }

  async componentDidMount() {
    const {cookies, orgSlug, setUserData, logout, params, settings, language} =
      this.props;
    const {status} = params;
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
      // User will need internet access for completing the payment whether
      // they are registering with a paid plan or upgrade to one.
      (userData.in_upgrade || (method === "bank_card" && isVerified === false))
    ) {
      setUserData({
        ...userData,
        mustLogin: settings.payment_requires_internet ? true : undefined,
      });
    }
  }

  // a user who gives up on a plan upgrade keeps the plan they already
  // paid for, so they are sent back to the status page without logging out
  backToStatus = () => {
    const {orgSlug, navigate} = this.props;
    navigate(`/${orgSlug}/status`);
  };

  logout = () => {
    const {logout, cookies, orgSlug, setUserData, userData, navigate} =
      this.props;
    const redirectToStatus = (statusUrl = `/${orgSlug}/status`) =>
      navigate(statusUrl);
    handleLogout(
      logout,
      cookies,
      orgSlug,
      setUserData,
      userData,
      false,
      redirectToStatus,
    );
  };

  render() {
    const {orgSlug, params, isAuthenticated, userData} = this.props;
    const {status} = params;
    const {method, is_verified: isVerified, in_upgrade: inUpgrade} = userData;
    const redirectToStatus = () => <Navigate to={`/${orgSlug}/status`} />;
    const acceptedValues = ["success", "failed", "draft"];
    const {isTokenValid} = this.state;
    // a user upgrading their plan keeps the registration method and the
    // verified flag they already had, so the checks written for the bank
    // card registration flow would send them away from this page
    const isFailedUpgrade = Boolean(inUpgrade) && status === "failed";
    // a user upgrading their plan keeps the registration method and the
    // verified flag they already had, so the draft page checks written for
    // the bank card registration flow would otherwise send them away
    const isDraftUpgrade = Boolean(inUpgrade) && status === "draft";
    // invalid status, not registered with bank card flow, or likely
    // somebody opening this page by mistake
    const shouldRedirectToStatus =
      !acceptedValues.includes(status) ||
      (!inUpgrade && method && method !== "bank_card") ||
      (isAuthenticated === false && status !== "draft") ||
      (!isFailedUpgrade &&
        !isDraftUpgrade &&
        ["failed", "draft"].includes(status) &&
        isVerified === true) ||
      (status === "success" && isVerified === false) ||
      isTokenValid === false;

    if (shouldRedirectToStatus) {
      return redirectToStatus();
    }

    // draft case
    // if (isAuthenticated === false && status === "draft") {
    if (status === "draft") {
      return this.renderDraft(isDraftUpgrade);
    }

    // success case
    if (isTokenValid === true && status === "success" && isVerified === true) {
      toast.success(t`PAY_SUCCESS`);
      return redirectToStatus();
    }

    // isTokenValid is still null while validateToken() is resolving, so
    // in_upgrade (and therefore isFailedUpgrade) isn't reliable yet on a cold
    // reload; show a loader instead of flashing the wrong failed-page variant
    if (status === "failed" && isTokenValid === null) {
      return <Loader />;
    }

    return this.renderFailed(isFailedUpgrade);
  }

  paymentProceedHandler() {
    const {authenticate, setUserData, userData, settings} = this.props;
    // Payment gateway may require internet access.
    // Since, captive portal login is handled by the Status component,
    // the user is navigated to the "/status" for captive portal login
    // which then redirects the user to the payment gateway.
    if (settings.payment_requires_internet) {
      setUserData({
        ...userData,
        proceedToPayment: true,
      });
    }
    authenticate(true);
  }

  renderDraft(isDraftUpgrade = false) {
    const {orgSlug, page = {}, settings} = this.props;
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
                  onClick={this.paymentProceedHandler}
                >
                  {t`PAY_PROC_BTN`}
                </Link>
              </div>

              <div className="row">
                <button
                  type="button"
                  className="button full"
                  onClick={isDraftUpgrade ? this.backToStatus : this.logout}
                >
                  {isDraftUpgrade ? t`PAY_GO_BACK_BTN` : t`PAY_GIVE_UP_BTN`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderFailed(isFailedUpgrade = false) {
    const {orgSlug, userData} = this.props;
    const retryUrl = isFailedUpgrade
      ? `/${orgSlug}/payment/process`
      : `/${orgSlug}/payment/draft`;
    // an upgrade which ran out of allowed payment attempts has no
    // payment URL left to send the user to
    const showRetry = !isFailedUpgrade || Boolean(userData.payment_url);
    // failed payment case
    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <h2 className="row payment-status-row-1">{t`PAY_FAIL`}</h2>
              <div className="row payment-status-row-2">{t`PAY_SUB_H`}</div>
              {showRetry && (
                <div className="row payment-status-row-3">
                  <Link className="button full" to={retryUrl}>
                    {t`PAY_TRY_AGAIN_BTN`}
                  </Link>
                </div>
              )}

              <div className="row payment-status-row-4">
                <p>{t`PAY_GIVE_UP_TXT`}</p>
                <button
                  type="button"
                  className="button full"
                  onClick={isFailedUpgrade ? this.backToStatus : this.logout}
                >
                  {isFailedUpgrade ? t`PAY_GO_BACK_BTN` : t`PAY_GIVE_UP_BTN`}
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
  page: PropTypes.object,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  settings: PropTypes.shape({
    payment_requires_internet: PropTypes.bool,
  }).isRequired,
  params: PropTypes.shape({
    status: PropTypes.string,
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};
