import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import logInternalError from "../utils/log-internal-error";

const passwordChange = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      let url = conf.proxy_urls.password_change;
      // replacing org_slug param with the slug
      url = url.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 1000;
      const authTokenCookie = req.cookies[`${conf.slug}_auth_token`];
      const token = cookie.unsign(authTokenCookie, conf.secret_key);
      const {newPassword1, newPassword2} = req.body;
      if (token) {
        // make AJAX request
        axios({
          method: "post",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          url: `${host}${url}/`,
          timeout,
          data: qs.stringify({
            new_password1: newPassword1,
            new_password2: newPassword2,
          }),
        })
          .then((response) => {
            // forward response
            res
              .status(response.status)
              .type("application/json")
              .send(response.data);
          })
          .catch((error) => {
            if (error.response && error.response.status === 500)
              logInternalError(error);
            // forward error
            try {
              res
                .status(error.response.status)
                .type("application/json")
                .send(error.response.data);
            } catch (err) {
              logInternalError(error);
              res.status(500).type("application/json").send({
                detail: "Internal server error",
              });
            }
          });
      } else {
        res.status(401).type("application/json").send({
          detail: "Invalid Token",
        });
      }
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

export default passwordChange;
