/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import React from "react";
import {gettext, t} from "ttag";
import Loader from "../../utils/loader";
import "./index.css";

export default class PaymentGateway extends React.Component {
  constructor(props) {
    super(props);
    this.state = {logoStatus: {}};
  }

  setLogoStatus(url, status) {
    this.setState((state) => ({
      logoStatus: {...state.logoStatus, [url]: status},
    }));
  }

  hasPendingLogos() {
    const {gateways} = this.props;
    const {logoStatus} = this.state;
    return gateways.some(
      (gateway) => gateway.logo_url && !logoStatus[gateway.logo_url],
    );
  }

  renderLogo(url) {
    const {logoStatus} = this.state;
    if (logoStatus[url] === "failed") {
      return null;
    }
    return (
      <span className="payment-gateway-logo">
        <img
          src={url}
          alt=""
          aria-hidden="true"
          onLoad={() => this.setLogoStatus(url, "loaded")}
          onError={() => this.setLogoStatus(url, "failed")}
        />
      </span>
    );
  }

  renderChoices() {
    const {gateways, selected, onSelect} = this.props;
    if (!gateways.length) {
      return (
        <div className="row payment-gateway-unavailable">{t`ERR_OCCUR`}</div>
      );
    }
    return (
      <div
        className="row payment-gateways"
        role="radiogroup"
        aria-labelledby="payment-gateway-title"
      >
        {gateways.map((gateway) => {
          let optionClass = "payment-gateway-option";
          if (selected === gateway.key) {
            optionClass += " payment-gateway-option-selected";
          }
          /* disable ttag */
          const gatewayLabel = gettext(gateway.label);
          /* enable ttag */
          return (
            <div className={optionClass} key={gateway.key}>
              <label htmlFor={`payment-gateway-${gateway.key}`}>
                <span className="payment-gateway-name">{gatewayLabel}</span>
                {gateway.logo_url && this.renderLogo(gateway.logo_url)}
                <input
                  id={`payment-gateway-${gateway.key}`}
                  type="radio"
                  name="payment_gateway"
                  value={gateway.key}
                  checked={selected === gateway.key}
                  onChange={(event) => onSelect(event.target.value)}
                />
              </label>
            </div>
          );
        })}
      </div>
    );
  }

  renderCancel() {
    const {onCancel, cancelLabel} = this.props;
    return (
      <div className="row">
        <button type="button" className="button full" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    );
  }

  renderError() {
    const {onRetry} = this.props;
    return (
      <>
        <div className="row alert alert-danger">{t`ERR_OCCUR`}</div>
        <div className="row">
          <button type="button" className="button full" onClick={onRetry}>
            {t`PAY_TRY_AGAIN_BTN`}
          </button>
        </div>
        {this.renderCancel()}
      </>
    );
  }

  render() {
    const {selected, submitting, error, onProceed} = this.props;
    const loading = !error && this.hasPendingLogos();
    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column single">
            <div
              className={`inner${loading ? " payment-gateway-loading" : ""}`}
            >
              {error ? (
                this.renderError()
              ) : (
                <>
                  <h2 className="row" id="payment-gateway-title">
                    {t`PAY_GATEWAY_REQ`}
                  </h2>
                  {this.renderChoices()}
                  <div className="row">
                    <button
                      type="button"
                      className="button full"
                      disabled={!selected || submitting}
                      onClick={onProceed}
                    >
                      {t`PAY_PROC_BTN`}
                    </button>
                  </div>
                  {this.renderCancel()}
                </>
              )}
            </div>
          </div>
        </div>
        {loading && <Loader />}
      </div>
    );
  }
}

PaymentGateway.propTypes = {
  gateways: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      logo_url: PropTypes.string,
    }),
  ).isRequired,
  selected: PropTypes.string,
  submitting: PropTypes.bool.isRequired,
  error: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onProceed: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  cancelLabel: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};
