import cookie from "cookie-signature";

const sendCookies = (response, conf, res, user = null) => {
  let {username} = response.data;
  if (user) {
    username = user;
  }

  // save token in signed cookie
  const authTokenCookie = cookie.sign(response.data.key, conf.secret_key);
  const usernameCookie = cookie.sign(username, conf.secret_key);
  // forward response
  return res
    .status(response.status)
    .type("application/json")
    .cookie(`${conf.slug}_auth_token`, authTokenCookie, {
      maxAge: 1000 * 60 * 60 * 24,
    })
    .cookie(`${conf.slug}_username`, usernameCookie, {
      maxAge: 1000 * 60 * 60 * 24,
    })
    .send(response.data);
};
export default sendCookies;
