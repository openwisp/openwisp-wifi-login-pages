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
import cancelUpgradePlan from "../../utils/cancel-upgrade-plan";
import logError from "../../utils/log-error";
import {storeValue, clearStoredValue} from "../../utils/synced-storage";

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
      // Skip logout/login cycle if CoA handles session group updates transparently
      if (!settings.captive_portal_supports_coa) {
        setUserData({
          ...userData,
          mustLogin: !settings.payment_requires_internet,
          mustLogout: settings.payment_requires_internet,
          repeatLogin: settings.payment_requires_internet,
        });
      }
    } else if (
      status === "draft" &&
      // Payment completion needs internet for both new registrations and upgrades
      (userData.in_upgrade || (method === "bank_card" && isVerified === false))
    ) {
      setUserData({
        ...userData,
        mustLogin: settings.payment_requires_internet ? true : undefined,
      });
    }
  }

  // Abandon upgrade: cancel order, clear flags, reconnect under current plan
  backToStatus = async () => {
    const {orgSlug, navigate, setUserData, userData, language, cookies} =
      this.props;
    try {
      const response = await cancelUpgradePlan(
        orgSlug,
        userData.auth_token || userData.key,
        language,
      );
      setUserData({
        ...userData,
        ...response,
        auth_token: response.auth_token || response.key || userData.auth_token,
        proceedToPayment: false,
        mustLogin: undefined,
        mustLogout: true,
        captivePortalLogoutOnly: true,
      });
    } catch (error) {
      if (!error.response || error.response.status !== 404) {
        toast.error(t`ERR_OCCUR`);
        logError(error, "Error while cancelling plan upgrade");
      }
      setUserData({
        ...userData,
        in_upgrade: false,
        proceedToPayment: false,
        payment_url: null,
        mustLogin: undefined,
        mustLogout: true,
        captivePortalLogoutOnly: true,
      });
    }
    // Clear persisted proceedToPayment flag
    clearStoredValue(`${orgSlug}_proceedToPayment`, cookies);
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
    // Upgraders retain their existing registration state; bypass bank-card redirect guards
    const isFailedUpgrade = Boolean(inUpgrade) && status === "failed";
    const isDraftUpgrade = Boolean(inUpgrade) && status === "draft";
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

    // Show loader while validateToken resolves in_upgrade state on cold reload
    if (status === "failed" && isTokenValid === null) {
      return <Loader />;
    }

    return this.renderFailed(isFailedUpgrade);
  }

  paymentProceedHandler() {
    const {
      authenticate,
      setUserData,
      userData,
      settings,
      cookies,
      orgSlug,
      captivePortalSyncAuth,
    } = this.props;
    // Payment gateway may require internet access.
    // Since, captive portal login is handled by the Status component,
    // the user is navigated to the "/status" for captive portal login
    // which then redirects the user to the payment gateway.
    if (settings.payment_requires_internet) {
      setUserData({
        ...userData,
        proceedToPayment: true,
      });
      // Persist so it survives page reload during sync captive portal auth
      storeValue(
        captivePortalSyncAuth,
        `${orgSlug}_proceedToPayment`,
        "true",
        cookies,
      );
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
    // No retry when upgrade payment attempts exhausted (no payment_url)
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
  captivePortalSyncAuth: PropTypes.bool,
  authenticate: PropTypes.func.isRequired,
  page: PropTypes.object,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  settings: PropTypes.shape({
    payment_requires_internet: PropTypes.bool,
    captive_portal_supports_coa: PropTypes.bool,
  }).isRequired,
  params: PropTypes.shape({
    status: PropTypes.string,
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};
