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
import {
  clearPaymentReturnContext,
  gatewayRoute,
  getGateways,
  getPaymentRoute,
  requiresInternet,
  selectGateway,
  takePaymentReturnContext,
} from "../../utils/payment";
import routes from "../../constants/routes";
import PaymentGateway from "../payment-gateway";

export default class PaymentStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isTokenValid: null,
      gateways: null,
      selectedGateway: null,
      submittingGateway: false,
      gatewayError: false,
      cancellationError: false,
    };
    this.paymentReturnUrlInput = React.createRef();
    this.isComponentMounted = true;
    this.gatewaySelectionId = 0;
    this.wasUpgrade = false;
    this.paymentProceedHandler = this.paymentProceedHandler.bind(this);
    this.copyPaymentReturnUrl = this.copyPaymentReturnUrl.bind(this);
    this.selectGateway = this.selectGateway.bind(this);
    this.proceedWithGateway = this.proceedWithGateway.bind(this);
  }

  async componentDidMount() {
    const {cookies, orgSlug, setUserData, userData, logout, language, params} =
      this.props;
    const {setLoading} = this.context;
    this.wasUpgrade = Boolean(userData.in_upgrade);

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
    if (!this.isComponentMounted) {
      return;
    }
    if (isTokenValid === false) {
      this.setState({isTokenValid});
      return;
    }
    if (params.status === "success") {
      await this.prepareStatus();
      this.setState({isTokenValid});
      return;
    }
    this.setState({isTokenValid});
    await this.prepareStatus();
  }

  componentDidUpdate(prevProps) {
    const {params} = this.props;
    const {isTokenValid} = this.state;
    // the same instance is reused when navigating between statuses,
    // eg: from gateway selection to draft
    if (isTokenValid && params.status !== prevProps.params.status) {
      this.prepareStatus();
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    this.gatewaySelectionId += 1;
  }

  // Runs the preparation of the current status, after token validation.
  async prepareStatus() {
    const {
      cookies,
      orgSlug,
      setUserData,
      userData,
      params,
      settings,
      captivePortalSyncAuth,
      navigate,
    } = this.props;
    const {status} = params;
    if (status === "cancelled") {
      // Upgrades have a server-side order to cancel and must restore the current plan.
      if (userData.in_upgrade) {
        await this.backToStatus();
      } else {
        // Registrations have no upgrade order, so clear the abandoned payment locally.
        // Gateway cancellation keeps the user signed in; the draft and gateway
        // selection pages offer a separate cancel-and-logout action.
        clearStoredValue(`${orgSlug}_proceedToPayment`, cookies);
        clearPaymentReturnContext();
        setUserData({
          ...userData,
          payment_id: null,
          payment_gateway: null,
          payment_url: null,
          payment_return_url: null,
          proceedToPayment: false,
        });
        navigate(`/${orgSlug}/status`);
      }
      return;
    }
    let paymentReturnContext = null;
    if (status === "success") {
      paymentReturnContext = takePaymentReturnContext();
    } else if (status === "failed") {
      clearPaymentReturnContext();
    }
    if (status === "gateway") {
      if (
        this.shouldRedirectToStatus() ||
        getPaymentRoute(orgSlug, userData, settings) !== gatewayRoute(orgSlug)
      ) {
        return;
      }
      await this.loadGateways(userData);
    }
    const {method, is_verified: isVerified} = userData;
    const paymentRequiresInternet = paymentReturnContext
      ? paymentReturnContext.paymentRequiresInternet
      : requiresInternet(userData, settings);
    // Restore captive portal access after payment completes.
    if (
      status === "success" &&
      isVerified === true &&
      (method === "bank_card" ||
        this.wasUpgrade ||
        (paymentReturnContext && paymentReturnContext.inUpgrade))
    ) {
      let flags;
      if (!settings.captive_portal_supports_coa) {
        flags = {
          mustLogin: !paymentRequiresInternet,
          mustLogout: Boolean(paymentRequiresInternet),
          repeatLogin: Boolean(paymentRequiresInternet),
        };
      } else if (paymentRequiresInternet === false) {
        // CoA cannot authorize a user who did not have a portal session.
        flags = {mustLogin: true, mustLogout: false, repeatLogin: false};
      }
      if (flags) {
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
        mustLogin: paymentRequiresInternet ? true : undefined,
      });
    }
  }

  async loadGateways(userData) {
    const {orgSlug, language} = this.props;
    const authToken = userData.auth_token || userData.key;
    this.setState({gateways: null, gatewayError: false});
    try {
      const response = await getGateways(
        orgSlug,
        userData.payment_id,
        authToken,
        language,
      );
      this.setState({gateways: response.gateways || []});
    } catch (error) {
      logError(error, "Unable to fetch payment gateways");
      this.setState({gatewayError: true});
    }
  }

  selectGateway(gateway) {
    this.setState({selectedGateway: gateway});
  }

  async proceedWithGateway() {
    const {selectedGateway, submittingGateway} = this.state;
    const {orgSlug, userData, settings, language, setUserData, navigate} =
      this.props;
    if (!selectedGateway || submittingGateway) {
      return;
    }
    this.gatewaySelectionId += 1;
    const {gatewaySelectionId: selectionId} = this;
    this.setState({submittingGateway: true, gatewayError: false});
    try {
      const response = await selectGateway(
        orgSlug,
        userData.payment_id,
        selectedGateway,
        userData.auth_token || userData.key,
        language,
      );
      if (!this.isComponentMounted || selectionId !== this.gatewaySelectionId) {
        return;
      }
      const nextUserData = {...userData, ...response};
      setUserData(nextUserData);
      navigate(getPaymentRoute(orgSlug, nextUserData, settings));
    } catch (error) {
      if (!this.isComponentMounted || selectionId !== this.gatewaySelectionId) {
        return;
      }
      logError(error, "Unable to select payment gateway");
      this.setState({gatewayError: true});
    } finally {
      if (this.isComponentMounted && selectionId === this.gatewaySelectionId) {
        this.setState({submittingGateway: false});
      }
    }
  }

  // Abandon upgrade: cancel order, clear flags, reconnect under current plan
  backToStatus = async () => {
    this.gatewaySelectionId += 1;
    const {
      orgSlug,
      navigate,
      setUserData,
      userData,
      language,
      cookies,
      params,
    } = this.props;
    if (params.status === "cancelled" && this.isComponentMounted) {
      this.setState({cancellationError: false});
    }
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
        const {params: currentParams} = this.props;
        if (currentParams.status === "cancelled" && this.isComponentMounted) {
          this.setState({cancellationError: true});
        }
        return;
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
    clearPaymentReturnContext();
    navigate(`/${orgSlug}/status`);
  };

  logout = () => {
    this.gatewaySelectionId += 1;
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

  // Whether the page was likely opened by mistake.
  shouldRedirectToStatus() {
    const {params, isAuthenticated, userData} = this.props;
    const {status} = params;
    const {method, is_verified: isVerified, in_upgrade: inUpgrade} = userData;
    const {isTokenValid} = this.state;
    // Upgraders retain their existing registration state; bypass bank-card redirect guards
    return (
      !routes.paymentStatus.statuses.includes(status) ||
      (!inUpgrade && method && method !== "bank_card") ||
      (isAuthenticated === false && status !== "draft") ||
      (!inUpgrade &&
        ["failed", "draft", "gateway"].includes(status) &&
        isVerified === true) ||
      (status === "success" && isVerified === false) ||
      isTokenValid === false
    );
  }

  render() {
    const {orgSlug, params, userData, isAuthenticated} = this.props;
    const {status} = params;
    const {is_verified: isVerified, in_upgrade: inUpgrade} = userData;
    const redirectToStatus = () => <Navigate to={`/${orgSlug}/status`} />;
    const {isTokenValid, cancellationError} = this.state;
    const isFailedUpgrade = Boolean(inUpgrade) && status === "failed";
    const isDraftUpgrade = Boolean(inUpgrade) && status === "draft";

    if (status === "success" && isTokenValid === null) {
      return <Loader />;
    }

    if (status === "cancelled") {
      if (isAuthenticated === false || isTokenValid === false) {
        return redirectToStatus();
      }
      return cancellationError ? this.renderDraft(true) : <Loader />;
    }

    if (this.shouldRedirectToStatus()) {
      return redirectToStatus();
    }

    if (isTokenValid === null) {
      return <Loader />;
    }

    if (status === "gateway") {
      return this.renderGateway();
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

  renderGateway() {
    const {gateways, selectedGateway, submittingGateway, gatewayError} =
      this.state;
    const {orgSlug, userData, settings} = this.props;
    const route = getPaymentRoute(orgSlug, userData, settings);
    if (route !== gatewayRoute(orgSlug)) {
      return <Navigate to={route} />;
    }
    if (gateways === null && !gatewayError) {
      return <Loader />;
    }
    const isUpgrade = Boolean(userData.in_upgrade);
    return (
      <PaymentGateway
        gateways={gateways || []}
        selected={selectedGateway}
        submitting={submittingGateway}
        error={gatewayError}
        onSelect={this.selectGateway}
        onProceed={this.proceedWithGateway}
        onCancel={isUpgrade ? this.backToStatus : this.logout}
        cancelLabel={isUpgrade ? t`PAY_GO_BACK_BTN` : t`PAY_GIVE_UP_BTN`}
        onRetry={() => this.loadGateways(userData)}
      />
    );
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
    if (requiresInternet(userData, settings)) {
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
    const {orgSlug, settings, userData} = this.props;
    return requiresInternet(userData, settings)
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
    if (!paymentReturnUrl) {
      return;
    }
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
    const {page, userData} = this.props;
    const {timeout, max_attempts: maxAttempts} = page;
    const {payment_return_url: paymentReturnUrl} = userData;
    const payProceedUrl = this.getProceedUrl();

    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column single">
            <div className="inner">
              <h2 className="row">{t`PAY_REQ`}</h2>

              {paymentReturnUrl && (
                <>
                  <div
                    id="payment-link-help"
                    className="row payment-instructions"
                    dangerouslySetInnerHTML={{
                      __html: t`PAY_LINK_INTRO${timeout}`,
                    }}
                  />

                  <div className="row payment-link">
                    <div className="payment-link-control">
                      <input
                        id="payment-link"
                        ref={this.paymentReturnUrlInput}
                        className="input payment-link-input"
                        type="text"
                        value={paymentReturnUrl}
                        readOnly
                        title={t`PAY_LINK_COPY_HINT`}
                        aria-label={t`PAY_LINK_LBL`}
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
                        <span className="payment-link-copy-label">
                          {t`PAY_LINK_COPY_BTN`}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div
                className="row payment-instructions"
                dangerouslySetInnerHTML={{
                  __html: t`PAY_RETRY_LIMIT${maxAttempts}`,
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
    const {orgSlug, userData, settings} = this.props;
    // User might have exhausted the temporary session quota while completing
    // the payment. Thus, we need to login them back in the captive portal
    // before directing them to the payment gateway.
    const paymentRoute = getPaymentRoute(orgSlug, userData, settings);
    let retryUrl = `/${orgSlug}/payment/draft`;
    if (paymentRoute === gatewayRoute(orgSlug)) {
      retryUrl = paymentRoute;
    } else if (isFailedUpgrade) {
      retryUrl = this.getProceedUrl();
    }
    // No retry when upgrade payment attempts exhausted (no payment_url)
    const showRetry = !isFailedUpgrade || Boolean(userData.payment_url);
    // Only re-run the captive portal login when internet is actually required;
    // otherwise the retry is a plain navigation to the payment gateway.
    const needsPortalLogin =
      isFailedUpgrade && requiresInternet(userData, settings);
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
  page: PropTypes.shape({
    timeout: PropTypes.number.isRequired,
    max_attempts: PropTypes.number.isRequired,
  }).isRequired,
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
