export const userPendingVerification = (user = {}) =>
  user.method === "pending_verification" && user.is_verified === false;

export const getVerificationRoute = (orgSlug, method) => {
  if (method === "bank_card") {
    return `/${orgSlug}/payment/draft`;
  }
  if (method === "mobile_phone") {
    return `/${orgSlug}/mobile-phone-verification`;
  }
  throw new Error(`Unknown verification method: ${method}`);
};
