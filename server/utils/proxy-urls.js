const prefix = "/api/v1/{orgSlug}";
const paths = {
  password_change: "/account/password/change",
  password_reset: "/account/password/reset",
  password_reset_confirm: "/account/password/reset/confirm",
  registration: "/account",
  user_auth_token: "/account/token",
  validate_auth_token: "/account/token/validate",
  user_radius_sessions: "/account/session",
  plans: "/plan",
  create_mobile_phone_token: "/account/phone/token",
  verify_mobile_phone_token: "/account/phone/verify",
  mobile_phone_number_change: "/account/phone/change",
};

const reverse = (name, orgSlug) => {
  const path = paths[name];
  if (!path) {
    throw new Error(`Reverse for path "${name}" not found.`);
  }
  return `${prefix.replace("{orgSlug}", orgSlug)}${path}`;
};

export default reverse;
