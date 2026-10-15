import axios from "axios";

import {paymentGatewayUrl} from "../constants";
import getLanguageHeaders from "./get-language-headers";

// Whether the backend reported if the selected payment gateway needs
// internet access (older backends do not send this metadata).
export const hasPaymentRequirement = (userData) =>
  Object.prototype.hasOwnProperty.call(userData, "payment_requires_internet");

// A user has a pending payment when the backend returned its id or URL.
export const hasPendingPayment = (userData) =>
  Boolean(userData.payment_id || userData.payment_url);

// Page where the user chooses the gateway of a payment.
export const gatewayRoute = (orgSlug) => `/${orgSlug}/payment/gateway`;

const requestPaymentGateway = (
  method,
  orgSlug,
  paymentId,
  authToken,
  language,
  data,
) =>
  axios({
    method,
    headers: {
      "content-type": "application/json",
      "accept-language": getLanguageHeaders(language),
      Authorization: `Bearer ${authToken}`,
    },
    url: paymentGatewayUrl(orgSlug, paymentId),
    data,
  }).then((response) => response.data);

// Lists the gateways available for a payment.
export const getGateways = (orgSlug, paymentId, authToken, language) =>
  requestPaymentGateway("get", orgSlug, paymentId, authToken, language);

// Selects the gateway used to pay.
export const selectGateway = (
  orgSlug,
  paymentId,
  gateway,
  authToken,
  language,
) =>
  requestPaymentGateway("patch", orgSlug, paymentId, authToken, language, {
    gateway,
  });

// Returns true when the payment page needs captive portal login first,
// false when it can be opened offline and null when no gateway is selected.
// The value reported by the backend wins over the organization setting,
// which is only used for backends that do not report it.
export const requiresInternet = (userData, settings) => {
  if (hasPaymentRequirement(userData)) {
    return userData.payment_requires_internet;
  }
  return Boolean(settings.payment_requires_internet);
};

export const usesPaymentIframe = (userData, settings) => {
  if (Object.prototype.hasOwnProperty.call(userData, "payment_iframe")) {
    return userData.payment_iframe;
  }
  return Boolean(settings.payment_iframe);
};

// Picks the page where a pending payment is continued:
// - no pending payment: the status page, there is nothing to pay;
// - no gateway selected: the gateway page, because the choice decides
//   whether internet access is needed;
// - gateway needs internet: the draft page, where the user logs in to the
//   captive portal before paying;
// - offline gateway: the payment process page, no login is needed.
// Older backends do not report the gateway metadata, in which case the
// organization setting decides between the draft and process pages.
export const getPaymentRoute = (orgSlug, userData, settings) => {
  if (!hasPendingPayment(userData)) {
    return `/${orgSlug}/status`;
  }
  const internetRequired = requiresInternet(userData, settings);
  if (internetRequired === null) {
    return gatewayRoute(orgSlug);
  }
  return internetRequired
    ? `/${orgSlug}/payment/draft`
    : `/${orgSlug}/payment/process`;
};
