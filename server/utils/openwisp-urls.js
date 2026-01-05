const owPrefix = "/api/v1/radius/organization/{orgSlug}";
const paths = {
  password_change: "/account/password/change",
  password_reset: "/account/password/reset",
  password_reset_confirm: "/account/password/reset/confirm",
  registration: "/account",
  user_authToken: "/account/token",
  validate_authToken: "/account/token/validate",
  user_radius_sessions: "/account/session",
  user_radius_usage: "/account/usage",
  user_plan_radius_usage: "/account/plan",
  create_mobile_phone_token: "/account/phone/token",
  mobile_phone_token_status: "/account/phone/token/active",
  verify_mobile_phone_token: "/account/phone/verify",
  mobile_phoneNumberChange: "/account/phone/change",
  plans: "/plan",
  payment_status: "/payment/{paymentId}/status",
};

const reverse = (name, orgSlug) => {
  const path = paths[name];
  let prefix = owPrefix;
  if (!path) {
    throw new Error(`Reverse for path "${name}" not found.`);
  }
  if (
    name === "plans" ||
    name === "payment_status" ||
    name === "user_plan_radius_usage"
  ) {
    prefix = prefix.replace("/radius/", "/subscriptions/");
  }
  return `${prefix.replace("{orgSlug}", orgSlug)}${path}`;
};

export default reverse;
