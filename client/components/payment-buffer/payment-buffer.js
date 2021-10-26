/* eslint-disable react/require-default-props */
import "./index.css";
import PropTypes from "prop-types";
import React from "react";
import {Link, Redirect} from "react-router-dom";
// import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import getPaymentStatus from "../../utils/get-payment-status";

export default class PaymentBuffer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paymentStatus: false,
      redirectUrl: null,
    };
  }

  async componentDidMount() {
    const {setLoading} = this.context;
    setLoading(true);
    const {orgSlug, isAuthenticated, settings} = this.props;
    const searchParams = new URLSearchParams(window.location.search);
    const oneTimeToken = searchParams.get(settings.oneTimeTokenName);
    const paymentId = searchParams.get("payment_id");
    // User have accessed this page by mistake
    if (!oneTimeToken || !paymentId) {
      if (isAuthenticated) {
        this.setState({redirectUrl: `/${orgSlug}/status`});
      } else {
        this.setState({redirectUrl: `/${orgSlug}/login`});
      }
    } else {
      // Use oneTimeToken to get payment status
      const paymentStatus = await getPaymentStatus(
        orgSlug,
        paymentId,
        oneTimeToken,
      );
      if (isAuthenticated && paymentStatus) {
        switch (paymentStatus) {
          case "waiting":
            this.setState({redirectUrl: `/${orgSlug}/payment/draft`});
            break;
          case "success":
          case "failed":
            this.setState({
              redirectUrl: `/${orgSlug}/payment/${paymentStatus}`,
            });
            break;
          default:
          // noop
        }
      }
      this.setState({paymentStatus});
    }
    setLoading(false);
  }

  render() {
    const {redirectUrl, paymentStatus} = this.state;
    let statusHeading;
    let message;
    if (redirectUrl) {
      const redirect = () => <Redirect to={redirectUrl} />;
      return redirect();
    }
    switch (paymentStatus) {
      // Mark them for translations
      case "success":
        statusHeading = "Your transaction was successful.";
        message = "Kindly login to start using wifi service.";
        break;
      case "failed":
        statusHeading = "Your transaction failed.";
        message = "You can start a new transaction after signing in.";
        break;
      case "waiting":
        statusHeading = "You transaction is pending.";
        message = "Sign-in to complete the transaction.";
        break;
      default:
        // An error occurred while fetching payment status
        // Ask users to log in and re-try again
        statusHeading = "Sign-in to check transaction status";
    }
    return this.renderPage(statusHeading, message);
  }

  renderPage(heading, message) {
    const {orgSlug} = this.props;
    return (
      <div className="container content">
        <div className="inner payment-buffer">
          <div className="main-column single">
            <div className="inner">
              <h2 className="row"> {heading} </h2>
              <div
                className="row"
                dangerouslySetInnerHTML={{
                  __html: message,
                }}
              />
              <div className="row">
                <Link className="button full" to={`/${orgSlug}/login/`}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
PaymentBuffer.contextType = LoadingContext;
PaymentBuffer.propTypes = {
  orgSlug: PropTypes.string,
  isAuthenticated: PropTypes.bool,
  settings: PropTypes.object.isRequired,
};
