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
    this.paymentReturnUrlInput = React.createRef();
    this.paymentProceedHandler = this.paymentProceedHandler.bind(this);
    this.copyPaymentReturnUrl = this.copyPaymentReturnUrl.bind(this);
  }

  async componentDidMount() {
    const {
      cookies,
      orgSlug,
      setUserData,
      logout,
      params,
      settings,
      language,
      captivePortalSyncAuth,
    } = this.props;
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
        const flags = {
          mustLogin: !settings.payment_requires_internet,
          mustLogout: Boolean(settings.payment_requires_internet),
          repeatLogin: Boolean(settings.payment_requires_internet),
        };
        setUserData({...userData, ...flags});
        // keep the flags across the page reload of synchronous auth
        Object.entries(flags).forEach(([key, value]) =>
          storeValue(
            captivePortalSyncAuth,
            `${orgSlug}_${key}`,
            value,
            cookies,
          ),
        );
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
        in_upgrade: false,
        proceedToPayment: false,
        payment_url: null,
        payment_return_url: null,
        mustLogin: undefined,
        mustLogout: true,
        captivePortalLogoutOnly: true,
      });
    } catch (error) {
      // The API replies 404 when there is no pending upgrade order left to
      // cancel, which is a no-op for the user rather than an error. A 404
      // from our own server carries response_code NOT_FOUND and means the
      // org slug is unknown, so keep surfacing that one.
      const noPendingOrder =
        error.response &&
        error.response.status === 404 &&
        (error.response.data || {}).response_code !== "NOT_FOUND";
      if (!noPendingOrder) {
        toast.error(t`ERR_OCCUR`);
        logError(error, "Error while cancelling plan upgrade");
      }
      setUserData({
        ...userData,
        in_upgrade: false,
        proceedToPayment: false,
        payment_url: null,
        payment_return_url: null,
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

    if (isTokenValid === null) {
      return <Loader />;
    }

    // draft case
    if (status === "draft") {
      return this.renderDraft(isDraftUpgrade);
    }

    // success case
    if (isTokenValid === true && status === "success" && isVerified === true) {
      toast.success(t`PAY_SUCCESS`);
      return redirectToStatus();
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
        mustLogin: true,
        proceedToPayment: true,
      });
      // Persist so it survives page reload during sync captive portal auth
      storeValue(captivePortalSyncAuth, `${orgSlug}_mustLogin`, true, cookies);
      storeValue(
        captivePortalSyncAuth,
        `${orgSlug}_proceedToPayment`,
        true,
        cookies,
      );
    }
    authenticate(true);
  }

  getProceedUrl() {
    const {orgSlug, settings} = this.props;
    return settings.payment_requires_internet
      ? `/${orgSlug}/status`
      : `/${orgSlug}/payment/process`;
  }

  // Selects the visible return URL for the legacy copy fallback.
  selectPaymentReturnUrl() {
    const input = this.paymentReturnUrlInput.current;
    if (!input) {
      return false;
    }
    input.focus();
    input.select();
    return true;
  }

  /**
   * Copies the return URL with the Clipboard API or a selected-input fallback.
   */
  async copyPaymentReturnUrl() {
    const {userData} = this.props;
    const {payment_return_url: paymentReturnUrl} = userData;
    let error;
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(paymentReturnUrl);
        toast.success(t`PAY_LINK_COPIED`, {autoClose: 3000});
        return;
      } catch (clipboardError) {
        error = clipboardError;
      }
    }

    // Select the visible URL before using the legacy document copy fallback.
    try {
      if (
        this.selectPaymentReturnUrl() &&
        typeof document !== "undefined" &&
        typeof document.execCommand === "function" &&
        document.execCommand("copy")
      ) {
        toast.success(t`PAY_LINK_COPIED`, {autoClose: 3000});
        return;
      }
    } catch (fallbackError) {
      error = fallbackError;
    }

    toast.error(t`PAY_LINK_COPY_FAIL`);
    logError(
      error || new Error("Payment link copy fallback failed"),
      "Unable to copy payment link",
    );
  }

  renderDraft(isDraftUpgrade = false) {
    const {page = {}, settings, userData} = this.props;
    const {timeout = 5, max_attempts: maxAttempts = 3} = page;
    const {payment_return_url: paymentReturnUrl} = userData;
    const payProceedUrl = this.getProceedUrl();

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

              {settings.payment_requires_internet && paymentReturnUrl && (
                <div className="row payment-link">
                  <p
                    id="payment-link-help"
                    dangerouslySetInnerHTML={{__html: t`PAY_LINK_HELP`}}
                  />
                  <label htmlFor="payment-link">{t`PAY_LINK_LBL`}</label>
                  <div className="payment-link-control">
                    <input
                      id="payment-link"
                      ref={this.paymentReturnUrlInput}
                      className="input payment-link-input"
                      type="text"
                      value={paymentReturnUrl}
                      readOnly
                      title={t`PAY_LINK_COPY_HINT`}
                      aria-describedby="payment-link-help"
                      onClick={this.copyPaymentReturnUrl}
                    />
                    <button
                      type="button"
                      className="button partial payment-link-copy"
                      aria-label={t`PAY_LINK_COPY_BTN`}
                      onClick={this.copyPaymentReturnUrl}
                    >
                      <span
                        className="payment-link-copy-icon"
                        aria-hidden="true"
                      />
                      <span>{t`PAY_LINK_COPY_BTN`}</span>
                    </button>
                  </div>
                </div>
              )}

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
    const {orgSlug, userData, settings} = this.props;
    // User might have exhausted the temporary session quota while completing
    // the payment. Thus, we need to login them back in the captive portal
    // before directing them to the payment gateway.
    const retryUrl = isFailedUpgrade
      ? this.getProceedUrl()
      : `/${orgSlug}/payment/draft`;
    // No retry when upgrade payment attempts exhausted (no payment_url)
    const showRetry = !isFailedUpgrade || Boolean(userData.payment_url);
    // Only re-run the captive portal login when internet is actually required;
    // otherwise the retry is a plain navigation to the payment gateway.
    const needsPortalLogin =
      isFailedUpgrade && settings.payment_requires_internet;
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
                  <Link
                    className="button full"
                    to={retryUrl}
                    onClick={
                      needsPortalLogin ? this.paymentProceedHandler : undefined
                    }
                  >
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
