/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import React from "react";
import {gettext, t} from "ttag";
import "../../utils/plan.css";
import "./index.css";

export default class PaymentGateway extends React.Component {
  renderChoices() {
    const {gateways, selected, onSelect} = this.props;
    if (!gateways.length) {
      return (
        <div className="row payment-gateway-unavailable">{t`ERR_OCCUR`}</div>
      );
    }
    return (
      <div
        className="row plans payment-gateways"
        role="radiogroup"
        aria-labelledby="payment-gateway-title"
      >
        {gateways.map((gateway) => {
          let planClass = "plan";
          if (selected === gateway.key) {
            planClass += " active";
          }
          /* disable ttag */
          const gatewayLabel = gettext(gateway.label);
          /* enable ttag */
          return (
            <div className={planClass} key={gateway.key}>
              <label htmlFor={`payment-gateway-${gateway.key}`}>
                <span className="title">{gatewayLabel}</span>
                {gateway.logo_url && (
                  <span className="payment-gateway-logo">
                    <img src={gateway.logo_url} alt="" aria-hidden="true" />
                  </span>
                )}
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
      </>
    );
  }

  render() {
    const {selected, submitting, error, onProceed} = this.props;
    return (
      <div className="container content">
        <div className="inner">
          <div className="main-column single">
            <div className="inner">
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
                </>
              )}
            </div>
          </div>
        </div>
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
  onRetry: PropTypes.func,
};
