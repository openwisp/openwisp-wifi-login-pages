/* eslint-disable camelcase */
/* eslint jsx-a11y/label-has-associated-control: 0 */
import "./index.css";

import "react-toastify/dist/ReactToastify.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {loginSuccess, mainToastId} from "../../constants";
import getText from "../../utils/get-text";
import LoadingContext from "../../utils/loading-context";

export default class Logout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  loginUser = (isAuthenticated) => {
    const {authenticate} = this.props;
    if (!isAuthenticated) authenticate(true);
    toast.success(loginSuccess, {
      toastId: mainToastId,
    });
  };

  render() {
    const {language, logoutPage, orgSlug, isAuthenticated} = this.props;
    const {content, login_again} = logoutPage;
    return (
      <>
        <div className="container content" id="logout">
          <div className="inner">
            <div className="main-column w-100">
              <h2>{getText(content.text, language)}</h2>
              <div className="links row">
                <Link
                  onClick={() => this.loginUser(isAuthenticated)}
                  className="button partial"
                  to={`/${orgSlug}/login`}
                >
                  {getText(login_again.text, language)}
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
    content: PropTypes.object.isRequired,
    login_again: PropTypes.object.isRequired,
  }).isRequired,
  language: PropTypes.string.isRequired,
  orgSlug: PropTypes.string.isRequired,
  isAuthenticated: PropTypes.bool,
  authenticate: PropTypes.func.isRequired,
};
