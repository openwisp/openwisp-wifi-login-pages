import axios from "axios";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const updateRegistrationMethod = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const url = reverse("update_registration_method", getSlug(conf));
      const timeout = conf.timeout * 1000;
      const requestHeaders = req.headers || {};

      // compute allowed methods from config
      const allowedMethods = [];
      if (conf.subscriptions) {
        allowedMethods.push("bank_card");
      }
      if (conf.phone_verification) {
        allowedMethods.push("mobile_phone");
      }
      // validate method against allowed methods
      if (!allowedMethods.includes(req.body.method)) {
        res.status(400).type("application/json").send({
          response_code: "INVALID_METHOD",
        });
        return;
      }

      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/json",
          Authorization: requestHeaders.authorization,
          "accept-language": requestHeaders["accept-language"],
        },
        url: `${host}${url}/`,
        timeout,
        data: {method: req.body.method},
      })
        .then((response) => {
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch((error) => {
          logResponseError(error);
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
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
      response_code: "NOT_FOUND",
    });
  }
};

export default updateRegistrationMethod;
