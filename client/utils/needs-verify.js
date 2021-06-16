/*
 * returns true if the user should initiate
 * account verification with the specified method
 */
const needsVerify = (method, user, settings) => {
  if (user.is_active === false || user.is_verified === true) {
    return false;
  }

  if (method === "mobile_phone") {
    return (
      user.method === "mobile_phone" &&
      user.is_verified === false &&
      settings.mobile_phone_verification
    );
  }

  if (method === "bank_card") {
    return Boolean(
      user.method === "bank_card" &&
        user.is_verified === false &&
        user.payment_url &&
        settings.subscriptions,
    );
  }

  return false;
};
export default needsVerify;
