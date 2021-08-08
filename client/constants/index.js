export const confirmApiUrl = "/api/v1/{orgSlug}/account/password/reset/confirm";
export const loginApiUrl = (orgSlug) => `/api/v1/${orgSlug}/account/token`;
export const passwordChangeApiUrl = "/api/v1/{orgSlug}/account/password/change";
export const registerApiUrl = "/api/v1/{orgSlug}/account/";
export const plansApiUrl = "/api/v1/{orgSlug}/plans/";
export const resetApiUrl = "/api/v1/{orgSlug}/account/password/reset/";
export const validateApiUrl = (orgSlug) =>
  `/api/v1/${orgSlug}/account/token/validate`;
export const getUserRadiusSessionsUrl = (orgSlug) =>
  `/api/v1/${orgSlug}/account/session`;
export const createMobilePhoneTokenUrl = (orgSlug) =>
  `/api/v1/${orgSlug}/account/phone/token`;
export const verifyMobilePhoneTokenUrl = (orgSlug) =>
  `/api/v1/${orgSlug}/account/phone/verify`;
export const mobilePhoneChangeUrl = (orgSlug) =>
  `/api/v1/${orgSlug}/account/phone/change`;
export const mainToastId = "main_toast_id";
export const modalContentUrl = (orgSlug) => `/api/v1/${orgSlug}/modal`;
