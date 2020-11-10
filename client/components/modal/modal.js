import "./index.css";

import PropTypes from "prop-types";
import React from "react";
import {Link} from "react-router-dom";

import getText from "../../utils/get-text";

export default class Modal extends React.Component {
  componentDidMount() {
    document.addEventListener("keyup", this.handleKeyDown, false);
  }

  componentWillUnmount() {
    document.removeEventListener("keyup", this.handleKeyDown, false);
  }

  renderContent = () => {
    const {privacyPolicy, termsAndConditions, language, match} = this.props;
    const {name} = match.params;
    let content;
    if (name === "terms-and-conditions" && termsAndConditions.content)
      content = getText(termsAndConditions.content, language);
    else if (name === "privacy-policy" && privacyPolicy.content)
      content = getText(privacyPolicy.content, language);
    return {__html: content};
  };

  handleKeyDown = event => {
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
    return (
      <>
        <div className="modal-container">
          <div className="modal-row-close">
            <Link to={prevPath} className="modal-close-btn">
              X
            </Link>
          </div>
          <div
            className="modal-content"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={this.renderContent()}
          />
        </div>
      </>
    );
  }
}
Modal.propTypes = {
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
  privacyPolicy: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object,
  }).isRequired,
  termsAndConditions: PropTypes.shape({
    title: PropTypes.object,
    content: PropTypes.object,
  }).isRequired,
};
