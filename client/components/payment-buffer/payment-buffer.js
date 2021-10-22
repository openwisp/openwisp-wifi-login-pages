/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import React from "react";
import {Link, Redirect} from "react-router-dom";
import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import getPaymentStatus from "../../utils/get-payment-status"
export default class PaymentBuffer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paymentStatus: false,
      redirectUrl: null,
    };
  }
  async componentDidMount() {
    const {
      setLoading
    } = this.context;
    setLoading(true);
    const { orgSlug, isAuthenticated} = this.props;
    const searchParams = new URLSearchParams(window.location.search);
    const oneTimeToken = searchParams.get('status_token');
    const paymentId = searchParams.get('payment_id');
    // User have accessed this page by mistake
    if(!oneTimeToken || !paymentId){
      if (isAuthenticated){
        this.setState({redirectUrl: `/${orgSlug}/status`});
      }
      else {
        this.setState({redirectUrl: `/${orgSlug}/login`})
      }
    }
    // Use oneTimeToken to get payment status
    const paymentStatus = await getPaymentStatus(orgSlug, paymentId, oneTimeToken);

    if (isAuthenticated && paymentStatus) {
      this.setState({redirectUrl: `/${orgSlug}/payment/${paymentStatus}`})
    }
    this.setState({paymentStatus: paymentStatus})
    setLoading(false);
  }

  render() {
    let statusHeading, message;
    if (this.state.redirectUrl){
      const redirect = () => <Redirect to={this.state.redirectUrl} />
      return redirect();
    }
    switch (this.state.paymentStatus) {
      // Mark them for translations
      case "success":
        statusHeading = "Your transaction was successful.";
        message = "Kindly login to start using wifi service.";
        break;
      case "failed":
        statusHeading = "Your transaction failed.";
        message = "You can start a new transaction after logging in."
        break;
      case "waiting":
        statusHeading = "You transaction is pending.";
        message = "Login to complete the transaction.";
      default:
        // An error occurred while fetching payment status
        // Ask users to log in and re-try again
        statusHeading = "Login to check transaction status";
    }
    return this.renderPage(statusHeading, message);
  }

  renderPage(heading, message, buttonText, buttonLink) {
    const {orgSlug} = this.props;

    return (
      <div className = "container content" >
        <div className = "inner" >
          <div className = "main-column single" >
            <div className = "inner" >
              <h2 className = "row" > {heading} </h2>
              <div className = "row"
                dangerouslySetInnerHTML = {{
                  __html: message,
                }}
              />
              <div className = "row" >
                <Link className = "button full" to = {`/${orgSlug}/login/`}>
                  Login
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
  page: PropTypes.object,
  isAuthenticated: PropTypes.bool,
};
