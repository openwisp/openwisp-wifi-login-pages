import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import logInternalError from "../utils/log-internal-error";

const getUserRadiusSessions = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      let userRadiusSessionsUrl = conf.proxy_urls.user_radius_sessions;
      // replacing org_slug param with the slug
      userRadiusSessionsUrl = userRadiusSessionsUrl.replace(
        "{org_slug}",
        org.slug,
      );
      const timeout = conf.timeout * 1000;
      let {token} = req.query;
      if (req.query.session === "false")
        token = cookie.unsign(token, conf.secret_key);
      // make AJAX request
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        url: `${host}${userRadiusSessionsUrl}/`,
        timeout,
        params: req.query,
      })
        .then((response) => {
          if ("link" in response.headers) {
            res.setHeader("link", response.headers.link);
          }
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
              response_code: "INTERNAL_SERVER_ERROR",
            });
          }
        });
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res.status(404).type("application/json").send({
      response_code: "INTERNAL_SERVER_ERROR",
    });
  }
};

export default getUserRadiusSessions;
