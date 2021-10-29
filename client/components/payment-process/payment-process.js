/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Redirect} from "react-router-dom";
import LoadingContext from "../../utils/loading-context";
import validateToken from "../../utils/validate-token";
import getPaymentStatusRedirectUrl from "../../utils/get-payment-status";
import history from "../../utils/history";

export default class PaymentProcess extends React.Component {
  constructor(props) {
    super(props);
    this.iframeRef = React.createRef();
  }

  async componentDidMount() {
    const {cookies, orgSlug, setUserData, logout} = this.props;
    let {userData} = this.props;
    const {setLoading} = this.context;

    setLoading(true);
    this.isTokenValid = await validateToken(
      cookies,
      orgSlug,
      setUserData,
      userData,
      logout,
    );

    if (this.isTokenValid === false) {
      return;
    }

    ({userData} = this.props);
    setUserData({...userData});
    window.addEventListener("message", this.handlePostMessage);
    setLoading(false);
  }

  componentWillUnmount() {
    window.removeEventListener("message", this.handlePostMessage);
  }

  handlePostMessage = async (event) => {
    const {userData, cookies, orgSlug, setUserData} = this.props;
    const {message, type} = event.data;
    // For security reasons, read https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concern
    if (
      event.origin === new URL(userData.payment_url).origin ||
      event.origin === window.location.origin
    ) {
      if (type === "paymentSuccess") {
        // Get payment status from the backend
        const redirectUrl = await getPaymentStatusRedirectUrl(
          orgSlug,
          message.paymentId,
          {
            type: "Bearer",
            cookies,
          },
          setUserData,
          userData,
        );
        if (redirectUrl) {
          history.push(redirectUrl);
        }
      }
    }
  };

  render() {
    const {orgSlug, isAuthenticated, userData} = this.props;
    const {method, is_verified: isVerified} = userData;
    const redirectToStatus = () => <Redirect to={`/${orgSlug}/status`} />;

    // not registered with bank card flow
    if (
      (method && method !== "bank_card") ||
      isVerified === true ||
      !userData.payment_url
    ) {
      return redirectToStatus();
    }

    // likely somebody opening this page by mistake
    if (isAuthenticated === false || this.isTokenValid === false) {
      return redirectToStatus();
    }

    return (
      <div className="container content">
        <div className="inner payment-buffer">
          <div className="main-column single">
            <iframe
              ref={this.iframeRef}
              src={userData.payment_url}
              name="owisp-payment-iframe"
              title="owisp-payment-iframe"
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
};
