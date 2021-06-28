/* eslint-disable camelcase */
/* eslint jsx-a11y/label-has-associated-control: 0 */
import "./index.css";

import "react-toastify/dist/ReactToastify.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import {loginSuccess, mainToastId} from "../../constants";
import LoadingContext from "../../utils/loading-context";

export default class Logout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const {orgName, setTitle} = this.props;
    setTitle(t`LOGOUT_PAGE_TITLE`, orgName);
  }

  loginUser = (isAuthenticated) => {
    const {authenticate, setUserData, userData} = this.props;
    if (!isAuthenticated) {
      authenticate(true);
      setUserData({...userData, justAuthenticated: true});
    }
    toast.success(loginSuccess, {
      toastId: mainToastId,
    });
    localStorage.setItem("userAutoLogin", false);
  };

  render() {
    const {orgSlug, isAuthenticated} = this.props;
    return (
      <>
        <div className="container content" id="logout">
          <div className="inner">
            <div className="main-column w-100">
              <h2>{t`LOGOUT_CONTENT`}</h2>
              <div className="links row">
                <Link
                  onClick={() => this.loginUser(isAuthenticated)}
                  className="button partial"
                  to={`/${orgSlug}/status`}
                >
                  {t`LOGIN_AGAIN`}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
Logout.contextType = LoadingContext;
Logout.defaultProps = {
  isAuthenticated: false,
};
Logout.propTypes = {
  logoutPage: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object.isRequired,
    login_again: PropTypes.object.isRequired,
  }).isRequired,
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  isAuthenticated: PropTypes.bool,
  authenticate: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
};
