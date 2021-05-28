import axios from "axios";
import cookie from "cookie-signature";
import merge from "deepmerge";
import qs from "qs";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import Logger from "../utils/logger";

const mobilePhoneNumberChange = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      let url = conf.proxy_urls.mobile_phone_number_change;
      // replacing org_slug param with the slug
      url = url.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 1000;
      let {token} = req.body;
      if (req.body.session === "false")
        token = cookie.unsign(token, conf.secret_key);
      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        url: `${host}${url}/`,
        timeout,
        data: qs.stringify({phone_number: req.body.phone_number}),
      })
        .then((response) => {
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch((error) => {
          Logger.error(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            Logger.error(err);
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

export default mobilePhoneNumberChange;
