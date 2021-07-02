/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Link, Redirect} from "react-router-dom";
import {toast} from "react-toastify";
import LoadingContext from "../../utils/loading-context";
import Contact from "../contact-box";
import getText from "../../utils/get-text";
import validateToken from "../../utils/validate-token";

export default class PaymentStatus extends React.Component {
  constructor(props) {
    super(props);
    this.handleLogout = this.handleLogout.bind(this);
  }

  async componentDidMount() {
    const {cookies, orgSlug, setUserData, logout, result} = this.props;
    let {userData} = this.props;
    const {setLoading} = this.context;

    setLoading(true);
    await validateToken(cookies, orgSlug, setUserData, userData, logout);
    setLoading(false);

    ({userData} = this.props);
    const {method, is_verified: isVerified} = userData;
    // flag user to repeat login in order to restart session with new radius group
    if (result === "success" && method === "bank_card" && isVerified === true) {
      setUserData({...userData, mustLogout: true, repeatLogin: true});
    }
  }

  handleLogout() {
    const {setUserData, userData} = this.props;
    setUserData({...userData, mustLogout: true});
  }

  render() {
    const {orgSlug, language, page, result, isAuthenticated, userData} =
      this.props;
    const {method, is_verified: isVerified} = userData;
    const redirectToStatus = () => <Redirect to={`/${orgSlug}/status`} />;
    const acceptedValues = ["success", "failed"];

    // not registered with bank card flow
    if (
      (method && method !== "bank_card") ||
      !acceptedValues.includes(result)
    ) {
      return redirectToStatus();
    }

    // likely somebody opening this page by mistake
    if (
      isAuthenticated === false ||
      (result === "failed" && isVerified === true) ||
      (result === "success" && isVerified === false)
    ) {
      return redirectToStatus();
    }

    // success case
    if (result === "success" && isVerified === true) {
      toast.success(getText(page.success, language));
      return redirectToStatus();
    }

    // failed payment case
    return (
      <div className="container content" id="not-foud-404">
        <div className="inner">
          <div className="main-column">
            <h2 className="row payment-status-row-1">
              {getText(page.heading, language)}: {result}
            </h2>
            <div className="row payment-status-row-2">
              {getText(page.sub_heading, language)}
            </div>
            <div className="row payment-status-row-3">
              <Link className="button full" to={`/${orgSlug}/status`}>
                {getText(page.try_again_button, language)}
              </Link>
            </div>

            <div className="row payment-status-row-4">
              <p>{getText(page.give_up_text, language)}</p>
              <Link
                onClick={this.handleLogout}
                to={`/${orgSlug}/status`}
                className="button full"
              >
                {getText(page.give_up_button, language)}
              </Link>
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
  page: PropTypes.shape({
    heading: PropTypes.object.isRequired,
    sub_heading: PropTypes.object.isRequired,
    try_again_button: PropTypes.object.isRequired,
    give_up_text: PropTypes.object.isRequired,
    give_up_button: PropTypes.object.isRequired,
    success: PropTypes.object.isRequired,
  }).isRequired,
  language: PropTypes.string,
  orgSlug: PropTypes.string,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  result: PropTypes.string.isRequired,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
};
