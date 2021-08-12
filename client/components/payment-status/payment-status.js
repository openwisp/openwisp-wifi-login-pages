/* eslint-disable react/require-default-props */
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Link, Redirect} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import LoadingContext from "../../utils/loading-context";
import Contact from "../contact-box";
import validateToken from "../../utils/validate-token";
import handleLogout from "../../utils/handle-logout";

export default class PaymentStatus extends React.Component {
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

  render() {
    const {
      orgSlug,
      result,
      isAuthenticated,
      userData,
      logout,
      setUserData,
      cookies,
    } = this.props;
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
      toast.success(t`PAY_SUCCESS`);
      return redirectToStatus();
    }

    // failed payment case
    return (
      <div className="container content" id="not-foud-404">
        <div className="inner">
          <div className="main-column">
            <div className="inner">
              <h2 className="row payment-status-row-1">
                {t`PAY_H`}: {result}
              </h2>
              <div className="row payment-status-row-2">{t`PAY_SUB_H`}</div>
              <div className="row payment-status-row-3">
                <Link className="button full" to={`/${orgSlug}/status`}>
                  {t`PAY_TRY_AGAIN_BTN`}
                </Link>
              </div>

              <div className="row payment-status-row-4">
                <p>{t`PAY_GIVE_UP_TXT`}</p>
                <Link
                  onClick={() =>
                    handleLogout(
                      logout,
                      cookies,
                      orgSlug,
                      setUserData,
                      userData,
                    )
                  }
                  to={`/${orgSlug}/status`}
                  className="button full"
                >
                  {t`PAY_GIVE_UP_BTN`}
                </Link>
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
  orgSlug: PropTypes.string,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  result: PropTypes.string.isRequired,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
};
