/*
 * returns true if the user should initiate
 * account verification with the specified method
 */
const needsVerify = (method, user, settings) => {
  if (user.isActive === false || user.isVerified === true) {
    return false;
  }

  if (method === "mobile_phone") {
    return (
      user.method === "mobile_phone" &&
      user.isVerified === false &&
      settings.mobilePhoneVerification
    );
  }

  if (method === "bank_card") {
    return Boolean(
      user.method === "bank_card" &&
      user.isVerified === false &&
      user.payment_url &&
      settings.subscriptions,
    );
  }

  return false;
};
export default needsVerify;
