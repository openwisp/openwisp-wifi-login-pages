import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import logInternalError from "../utils/log-internal-error";

export const createMobilePhoneToken = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some(org => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const { host } = conf;
      let url = conf.proxy_urls.create_mobile_phone_token;
      // replacing org_slug param with the slug
      url = url.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 1000;
      let token = req.cookies[`${reqOrg}_auth_token`] || "";
      token = cookie.unsign(token, conf.secret_key);
      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`,
        },
        url: `${host}${url}/`,
        timeout,
        data: qs.stringify({ token }),
      })
        .then(response => {
          delete response.data.auth_token;
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch(error => {
          if (error.response && error.response.status === 500) logInternalError(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            logInternalError(error);
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

export const verifyMobilePhoneToken = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some(org => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const { host } = conf;
      let url = conf.proxy_urls.verify_mobile_phone_token;
      // replacing org_slug param with the slug
      url = url.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 1000;
      let token = req.cookies[`${reqOrg}_auth_token`] || "";
      token = cookie.unsign(token, conf.secret_key);
      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`,
        },
        url: `${host}${url}/`,
        timeout,
        data: qs.stringify({ code: req.body.code }),
      })
        .then(response => {
          delete response.data.auth_token;
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch(error => {
          if (error.response && error.response.status === 500) logInternalError(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            logInternalError(error);
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
