export const confirmApiUrl = "/api/v1/{orgSlug}/account/password/reset/confirm";
export const genericError = "Error occurred!";
export const loginApiUrl = (orgSlug) => `/api/v1/${orgSlug}/account/token`;
export const loginError = "Login error occurred.";
export const loginSuccess = "Login successful";
export const logoutSuccess = "Logout successful";
export const mainToastId = "main_toast_id";
export const passwordChangeApiUrl = "/api/v1/{orgSlug}/account/password/change";
export const passwordChangeError =
  "Some error occured. Couldn't change password!";
export const passwordConfirmError = "The two password fields didn't match.";
export const registerApiUrl = "/api/v1/{orgSlug}/account/";
export const registerError = "Registration error.";
export const registerSuccess = "Registration success";
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
