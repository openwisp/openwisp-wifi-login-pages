/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Navigate} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import Loader from "../../utils/loader";
import validateToken from "../../utils/validate-token";
import getPaymentStatusRedirectUrl from "../../utils/get-payment-status";
import {
  gatewayRoute,
  getPaymentRoute,
  hasPendingPayment,
  storePaymentReturnContext,
  usesPaymentIframe,
} from "../../utils/payment";

export default class PaymentProcess extends React.Component {
  constructor(props) {
    super(props);
    this.iframeRef = React.createRef();
    this.state = {
      isTokenValid: null,
      iframeHeight: 450,
    };
  }

  async componentDidMount() {
    const {cookies, orgSlug, setUserData, logout, settings} = this.props;
    let {userData} = this.props;
    const initialUserData = userData;
    let validatedUserData;
    const {setLoading} = this.context;

    setLoading(true);
    toast.info(t`PLEASE_WAIT`, {autoClose: 10000});
    const isTokenValid = await validateToken(
      cookies,
      orgSlug,
      (data) => {
        // Connected props may not yet reflect the validation update.
        validatedUserData = data;
        setUserData(data);
      },
      userData,
      logout,
    );

    if (isTokenValid === false) {
      setLoading(false);
      return;
    }
    ({userData} = this.props);
    userData = validatedUserData || userData;
    const initialPayment = hasPendingPayment(initialUserData);
    // A completed-payment refresh can clear fields needed to restore portal
    // access, so retain the pending payment's original context in that case.
    const preserveInitialContext =
      initialPayment &&
      (!hasPendingPayment(userData) ||
        (initialUserData.in_upgrade && !userData.in_upgrade) ||
        (typeof initialUserData.payment_requires_internet === "boolean" &&
          userData.payment_requires_internet === undefined));
    const paymentData = preserveInitialContext ? initialUserData : userData;
    if (hasPendingPayment(paymentData)) {
      storePaymentReturnContext(paymentData, settings);
    }
    setUserData({...userData});
    this.setState({isTokenValid});
    window.addEventListener("message", this.handlePostMessage);
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.handlePostMessage);
  }

  handlePostMessage = async (event) => {
    const {userData, orgSlug, setUserData, navigate} = this.props;
    const {setLoading} = this.context;
    const {message, type} = event.data;
    // For security reasons, read https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concern
    if (
      (userData.payment_url &&
        event.origin === new URL(userData.payment_url).origin) ||
      event.origin === window.location.origin
    ) {
      switch (type) {
        case "paymentClose": {
          // Get payment status from the backend
          const redirectUrl = await getPaymentStatusRedirectUrl(
            orgSlug,
            message.paymentId,
            {
              tokenType: "Bearer",
              tokenValue: userData.auth_token,
            },
            setUserData,
            userData,
          );
          navigate(redirectUrl);
          break;
        }
        case "showLoader":
          setLoading(true);
          break;
        case "setHeight":
          this.setState({iframeHeight: message});
          setLoading(false);
          toast.dismiss();
          break;
        default:
        // no op
      }
    }
  };

  // eslint-disable-next-line class-methods-use-this
  redirectToPaymentUrl(paymentUrl) {
    window.location.assign(paymentUrl);
  }

  render() {
    const {orgSlug, isAuthenticated, userData, settings} = this.props;
    const redirectToStatus = () => <Navigate to={`/${orgSlug}/status`} />;
    const {isTokenValid, iframeHeight} = this.state;

    // not registered with bank card flow
    if (isTokenValid && !userData.payment_url) {
      return redirectToStatus();
    }

    // likely somebody opening this page by mistake
    if (isAuthenticated === false) {
      return redirectToStatus();
    }

    // checked before token validation to never load an unselected payment
    if (
      getPaymentRoute(orgSlug, userData, settings) === gatewayRoute(orgSlug)
    ) {
      return <Navigate to={gatewayRoute(orgSlug)} />;
    }

    // The return context must be saved before either payment presentation starts.
    if (isTokenValid !== true) {
      return <Loader />;
    }

    if (
      isTokenValid === true &&
      usesPaymentIframe(userData, settings) === false
    ) {
      this.redirectToPaymentUrl(userData.payment_url);
      return null;
    }

    return (
      <div className="container content">
        <div className="inner payment-process">
          <div className="main-column single">
            <iframe
              ref={this.iframeRef}
              src={userData.payment_url}
              name="owisp-payment-iframe"
              title="owisp-payment-iframe"
              height={iframeHeight}
            />
          </div>
        </div>
      </div>
    );
  }
}
PaymentProcess.contextType = LoadingContext;
PaymentProcess.propTypes = {
  orgSlug: PropTypes.string,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
  settings: PropTypes.shape({
    payment_iframe: PropTypes.bool,
  }).isRequired,
  navigate: PropTypes.func.isRequired,
};
