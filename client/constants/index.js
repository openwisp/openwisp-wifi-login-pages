export const confirmApiUrl =
  "/api/v1/radius/organization/{orgSlug}/account/password/reset/confirm";
export const loginApiUrl = (orgSlug) =>
  `/api/v1/radius/organization/${orgSlug}/account/token`;
export const passwordChangeApiUrl =
  "/api/v1/radius/organization/{orgSlug}/account/password/change";
export const registerApiUrl = "/api/v1/radius/organization/{orgSlug}/account/";
export const plansApiUrl = "/api/v1/subscriptions/organization/{orgSlug}/plan/";
export const resetApiUrl =
  "/api/v1/radius/organization/{orgSlug}/account/password/reset/";
export const validateApiUrl = (orgSlug) =>
  `/api/v1/radius/organization/${orgSlug}/account/token/validate`;
export const getUserRadiusSessionsUrl = (orgSlug) =>
  `/api/v1/radius/organization/${orgSlug}/account/session`;
export const createMobilePhoneTokenUrl = (orgSlug) =>
  `/api/v1/radius/organization/${orgSlug}/account/phone/token`;
export const verifyMobilePhoneTokenUrl = (orgSlug) =>
  `/api/v1/radius/organization/${orgSlug}/account/phone/verify`;
export const mobilePhoneChangeUrl = (orgSlug) =>
  `/api/v1/radius/organization/${orgSlug}/account/phone/change`;
export const mainToastId = "main_toast_id";
export const modalContentUrl = (orgSlug) => `/api/v1/${orgSlug}/modal`;
