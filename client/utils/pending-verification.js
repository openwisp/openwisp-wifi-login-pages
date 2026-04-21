export const getEnabledVerificationMethods = (settings = {}) => {
  const methods = [];
  if (settings.mobile_phone_verification) {
    methods.push("mobile_phone");
  }
  if (settings.subscriptions) {
    methods.push("bank_card");
  }
  return methods;
};

export const userPendingVerification = (user = {}) =>
  user.method === "pending_verification" && user.is_verified === false;

export const getVerificationRoute = (orgSlug, method) =>
  method === "bank_card"
    ? `/${orgSlug}/payment/draft`
    : `/${orgSlug}/mobile-phone-verification`;
