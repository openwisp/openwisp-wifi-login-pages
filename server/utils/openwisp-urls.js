const owPrefix = "/api/v1/radius/organization/{orgSlug}";
const paths = {
  password_change: "/account/password/change",
  password_reset: "/account/password/reset",
  password_reset_confirm: "/account/password/reset/confirm",
  registration: "/account",
  user_auth_token: "/account/token",
  validate_auth_token: "/account/token/validate",
  user_radius_sessions: "/account/session",
  create_mobile_phone_token: "/account/phone/token",
  mobile_phone_token_status: "/account/phone/token/active",
  verify_mobile_phone_token: "/account/phone/verify",
  mobile_phone_number_change: "/account/phone/change",
  plans: "/plan",
  payment_status: "/payment/{paymentId}/status",
  initiate_payment: "/payment/initiate",
  buy_plan: "/plan/buy",
};

const reverse = (name, orgSlug) => {
  const path = paths[name];
  let prefix = owPrefix;
  if (!path) {
    throw new Error(`Reverse for path "${name}" not found.`);
  }
  if (name === "plans" || name === "payment_status") {
    prefix = prefix.replace("/radius/", "/subscriptions/");
  }
  if (name === "initiate_payment" || name === "buy_plan") {
    prefix = prefix.replace("/radius/", "/payments/");
  }
  return `${prefix.replace("{orgSlug}", orgSlug)}${path}`;
};

export default reverse;
