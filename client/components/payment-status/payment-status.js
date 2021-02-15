/* eslint-disable react/require-default-props */
import axios from "axios";
import {Cookies} from "react-cookie";
import PropTypes from "prop-types";
import React from "react";
import {Link, Redirect} from "react-router-dom";
import {toast} from "react-toastify";
import qs from "qs";
import LoadingContext from "../../utils/loading-context";
import Contact from "../contact-box";
import logError from "../../utils/log-error";
import {genericError, mainToastId, validateApiUrl} from "../../constants";
import getText from "../../utils/get-text";
import handleSession from "../../utils/session";

export default class PaymentStatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_verified: null,
      method: null,
    };
    this.validateToken = this.validateToken.bind(this);
  }

  async componentDidMount() {
    await this.validateToken();
  }

  // TODO: make reusable
  async validateToken() {
    const {setLoading} = this.context;
    const {cookies, orgSlug, logout} = this.props;
    const authToken = cookies.get(`${orgSlug}_auth_token`);
    const {token, session} = handleSession(orgSlug, authToken, cookies);
    const url = validateApiUrl(orgSlug);
    setLoading(true);
    try {
      const response = await axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url,
        data: qs.stringify({
          token,
          session,
        }),
      });
      setLoading(false);
      if (response.data.response_code !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL") {
        logout(cookies, orgSlug);
        toast.error(genericError, {
          onOpen: () => toast.dismiss(mainToastId),
        });
        logError(
          response,
          '"response_code" !== "AUTH_TOKEN_VALIDATION_SUCCESSFUL"',
        );
      } else {
        const {data} = response;
        this.setState({
          is_verified: data.is_verified,
          method: data.method,
        });
      }
      return true;
    } catch (error) {
      logout(cookies, orgSlug);
      toast.error(genericError, {
        onOpen: () => toast.dismiss(mainToastId),
      });
      logError(error, genericError);
      return false;
    }
  }

  render() {
    const {orgSlug, cookies, language, page, result, logout} = this.props;
    const {method, is_verified: isVerified} = this.state;
    const redirectToStatus = () => <Redirect to={`/${orgSlug}/status`} />;

    // not registered with bank card flow
    if (method && method !== "bank_card") {
      return redirectToStatus();
    }

    // likely somebody opening this page by mistake
    if (
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
                onClick={() => logout(cookies, orgSlug)}
                to={`/${orgSlug}/login`}
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
  result: PropTypes.string.isRequired,
  logout: PropTypes.func.isRequired,
  cookies: PropTypes.instanceOf(Cookies).isRequired,
};
