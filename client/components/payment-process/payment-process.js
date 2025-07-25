/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Navigate} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import validateToken from "../../utils/validate-token";
import getPaymentStatusRedirectUrl from "../../utils/get-payment-status";

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
    const {cookies, orgSlug, setUserData, logout} = this.props;
    let {userData} = this.props;
    const {setLoading} = this.context;

    setLoading(true);
    toast.info(t`PLEASE_WAIT`, {autoClose: 10000});
    const isTokenValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );

    if (isTokenValid === false) {
      setLoading(false);
      return;
    }
    this.setState({isTokenValid});

    ({userData} = this.props);
    setUserData({...userData});
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

    if (isTokenValid === true && !settings.payment_iframe) {
      return this.redirectToPaymentUrl(userData.payment_url);
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
