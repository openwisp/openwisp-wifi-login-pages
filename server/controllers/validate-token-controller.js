import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";

const validateToken = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some(org => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      let validateTokenUrl = conf.proxy_urls.validate_auth_token;
      // replacing org_slug param with the slug
      validateTokenUrl = validateTokenUrl.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 1000;
      let {token} = req.body;
      token = cookie.unsign(token, conf.secret_key);
      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url: `${host}${validateTokenUrl}/`,
        timeout,
        data: qs.stringify({token}),
      })
        .then(response => {
          const authorizeUrl = conf.proxy_urls.authorize;
          const username = cookie.unsign(
            req.universalCookies.get(`${org.slug}_username`),
            conf.secret_key,
          );
          axios({
            method: "post",
            headers: {
              "content-type": "application/x-www-form-urlencoded",
            },
            url: `${host}${authorizeUrl}/`,
            timeout,
            params: {
              uuid: conf.uuid,
              token: conf.secret_key,
            },
            data: qs.stringify({
              username,
              password: response.data.radius_user_token,
            }),
          })
            .then(responseAuth => {
              res
                .status(responseAuth.status)
                .type("application/json")
                .send(responseAuth.data);
            })
            .catch(errorAuth => {
              res
                .status(errorAuth.response.status)
                .type("application/json")
                .send(errorAuth.response.data);
            });
        })
        .catch(error => {
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            res
              .status(500)
              .type("application/json")
              .send({
                response_code: "INTERNAL_SERVER_ERROR",
              });
          }
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res
      .status(404)
      .type("application/json")
      .send({
        response_code: "INTERNAL_SERVER_ERROR",
      });
  }
};

export default validateToken;
