import cookie from "cookie-signature";


const saveCookiesFromResponse = (response, conf, res) => {
  // Check if there are cookies in the response
  const cookies = response.headers["set-cookie"];

  if (cookies) {
    // Iterate over each cookie
    cookies.forEach(res_cookie => {

      // Split cookie string into individual attributes
      // Save the cookie using js-cookie
      const cookieParts = res_cookie.split(";");
      const [cookieName, cookieValue] = cookieParts[0].split("=");

      const signedCookie = cookie.sign(cookieValue, conf.secret_key);
      const options = {
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      };
      if (process.env.NODE_ENVIRONMENT == "production")
        options.secure = true;
      res.cookie(res_cookie);
    });
  }
};


const sendSessionCookies = (response, conf, res) => {
  saveCookiesFromResponse(response, conf, res);

  return res
    .status(response.status)
    .type("application/json")
    .send(response.data);
};
export default sendSessionCookies;
