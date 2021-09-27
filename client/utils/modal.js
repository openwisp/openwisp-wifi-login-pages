import React, {Component} from "react";
import propTypes from "prop-types";
import {t} from "ttag";
import "./modal.css";

class InfoModal extends Component {
  render() {
    const {active, toggleModal, handleResponse, content} = this.props;
    return (
      <div className={active ? "modal is-visible" : "modal"}>
        <div className="modal-container bg">
          <button
            type="button"
            className="modal-close-btn"
            onClick={toggleModal}
          >
            &#10006;
          </button>
          <div>{content}</div>
          <p className="modal-buttons">
            <button
              type="button"
              className="button partial"
              onClick={() => handleResponse(true)}
            >
              {t`YES`}
            </button>
            <button
              type="button"
              className="button partial"
              onClick={() => handleResponse(false)}
            >
              {t`NO`}
            </button>
          </p>
        </div>
      </div>
    );
  }
}

export default InfoModal;

InfoModal.propTypes = {
  active: propTypes.bool.isRequired,
  toggleModal: propTypes.func.isRequired,
  handleResponse: propTypes.func.isRequired,
  content: propTypes.object.isRequired,
};
