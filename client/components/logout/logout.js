/* eslint-disable camelcase */
/* eslint jsx-a11y/label-has-associated-control: 0 */
import "./index.css";

import "react-toastify/dist/ReactToastify.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {t} from "ttag";
import {mainToastId} from "../../constants";
import LoadingContext from "../../utils/loading-context";

export default class Logout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const {orgName, setTitle} = this.props;
    setTitle(t`LOGOUT`, orgName);
  }

  loginUser = (isAuthenticated) => {
    const {authenticate, setUserData, userData} = this.props;
    if (!isAuthenticated) {
      authenticate(true);
      setUserData({...userData, justAuthenticated: true});
    }
    toast.success(t`LOGIN_SUCCESS`, {
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
              <div className="inner">
                <h2>{t`LOGOUT_CONTENT`}</h2>
                <div className="links row">
                  <Link
                    onClick={() => this.loginUser(isAuthenticated)}
                    className="button partial"
                    to={`/${orgSlug}/status`}
                  >
                    {`${t`LOGIN`} ${t`AGAIN`}`}
                  </Link>
                </div>
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
  orgSlug: PropTypes.string.isRequired,
  orgName: PropTypes.string.isRequired,
  isAuthenticated: PropTypes.bool,
  authenticate: PropTypes.func.isRequired,
  userData: PropTypes.object.isRequired,
  setUserData: PropTypes.func.isRequired,
  setTitle: PropTypes.func.isRequired,
};
