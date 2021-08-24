import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import Logger from "../utils/logger";
import reverse from "../utils/proxy-urls";

const sendCookies = (username, response, conf, res) => {
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

const obtainToken = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const obtainTokenUrl = reverse("user_auth_token", org.slug);
      const timeout = conf.timeout * 1000;
      const {username, password} = req.body;
      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": req.headers["accept-language"],
        },
        url: `${host}${obtainTokenUrl}/`,
        timeout,
        data: qs.stringify({username, password}),
      })
        .then((response) => sendCookies(username, response, conf, res))
        .catch((error) => {
          Logger.error(error);
          try {
            Logger.warn(`status code: ${error.response.status}`);
            // unverified user recognized
            if (
              error.response.status === 401 &&
              error.response.data.is_active
            ) {
              return sendCookies(username, error.response, conf, res);
            }
            // forward error
            return res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            Logger.error(err);
            return res.status(500).type("application/json").send({
              detail: "Internal server error",
            });
          }
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res.status(404).type("application/json").send({
      detail: "Not found.",
    });
  }
};

export default obtainToken;
