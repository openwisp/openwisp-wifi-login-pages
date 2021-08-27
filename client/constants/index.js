export const prefix = "/api/v1";
export const confirmApiUrl = `${prefix}/{orgSlug}/account/password/reset/confirm`;
export const loginApiUrl = (orgSlug) => `${prefix}/${orgSlug}/account/token`;
export const passwordChangeApiUrl = `${prefix}/{orgSlug}/account/password/change`;
export const registerApiUrl = `${prefix}/{orgSlug}/account/`;
export const resetApiUrl = `${prefix}/{orgSlug}/account/password/reset/`;
export const validateApiUrl = (orgSlug) =>
  `${prefix}/${orgSlug}/account/token/validate`;
export const getUserRadiusSessionsUrl = (orgSlug) =>
  `${prefix}/${orgSlug}/account/session`;
export const createMobilePhoneTokenUrl = (orgSlug) =>
  `${prefix}/${orgSlug}/account/phone/token`;
export const verifyMobilePhoneTokenUrl = (orgSlug) =>
  `${prefix}/${orgSlug}/account/phone/verify`;
export const mobilePhoneChangeUrl = (orgSlug) =>
  `${prefix}/${orgSlug}/account/phone/change`;
export const plansApiUrl = `${prefix}/{orgSlug}/plan/`;
export const modalContentUrl = (orgSlug) => `${prefix}/${orgSlug}/modal`;
export const mainToastId = "main_toast_id";
