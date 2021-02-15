/*
 * will execute the necessary logic to initiate
 * account verification if needed and return true
 * otherwise it will return false
 */
const verify = (data, props) => {
  const {settings} = props;
  // initialize mobile phone verification if needed
  if (
    settings.mobile_phone_verification &&
    data.method === "mobile_phone" &&
    data.is_verified === false
  ) {
    return true;
  }

  // initialize bank card verification if needed
  if (
    settings.subscriptions &&
    data.method === "bank_card" &&
    data.is_verified === false &&
    data.payment_url
  ) {
    // TODO: we should redirect to status page
    // end let status page perform captive portal login
    window.location.assign(data.payment_url);
    return true;
  }

  return false;
};
export default verify;
