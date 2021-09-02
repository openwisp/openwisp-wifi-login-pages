import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";

import axios from "axios";
import getText from "../../utils/get-text";
import {modalContentUrl} from "../../constants";
import logError from "../../utils/log-error";
import Loader from "../../utils/loader";
import getLanguageHeaders from "../../utils/get-language-headers";

export default class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      content: "",
    };
    this.renderContent = this.renderContent.bind(this);
  }

  async componentDidMount() {
    await this.renderContent();
    document.addEventListener("keyup", this.handleKeyDown, false);
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.handleKeyDown, false);
  }

  renderContent = async () => {
    const {privacyPolicy, termsAndConditions, language, match, orgSlug} =
      this.props;
    const {name} = match.params;
    let file;
    let response = {};
    if (name === "terms-and-conditions" && termsAndConditions)
      file = getText(termsAndConditions, language);
    else if (name === "privacy-policy" && privacyPolicy)
      file = getText(privacyPolicy, language);
    try {
      response = await axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": getLanguageHeaders(language),
        },
        url: modalContentUrl(orgSlug),
        params: {
          file,
        },
      });
    } catch (err) {
      logError(err);
      response.data = {__html: ""};
    }
    this.setState({content: response.data, loading: false});
  };

  handleKeyDown = (event) => {
    const {prevPath, history} = this.props;
    switch (event.keyCode) {
      case 27:
        history.push(prevPath);
        break;
      default:
        break;
    }
  };

  render() {
    const {prevPath} = this.props;
    const {loading, content} = this.state;
    return (
      <>
        <div className="modal is-visible pt-4">
          <div className="modal-container w-900 text-left">
            <Link to={prevPath} className="modal-close-btn">
              &#10006;
            </Link>
            {loading ? (
              <Loader full={false} />
            ) : (
              <div
                className="message"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={content}
              />
            )}
          </div>
        </div>
      </>
    );
  }
}

Modal.propTypes = {
  orgSlug: PropTypes.string.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  prevPath: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  privacyPolicy: PropTypes.object.isRequired,
  termsAndConditions: PropTypes.object.isRequired,
};
