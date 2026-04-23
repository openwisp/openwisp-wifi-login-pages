export const userPendingVerification = (user = {}) =>
  user.method === "pending_verification" && user.is_verified === false;

export const getVerificationRoute = (orgSlug, method) =>
  method === "bank_card"
    ? `/${orgSlug}/payment/draft`
    : `/${orgSlug}/mobile-phone-verification`;
