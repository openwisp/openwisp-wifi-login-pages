import axios from "axios";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfigFromUtils from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const updateRegistrationMethod = (req, res, configOverride) => {
  const reqOrg = req.params.organization;
  const orgConfig = configOverride || config;
  const org = orgConfig.find((o) => o.slug === reqOrg);

  // Return 404 if organization not found
  if (!org) {
    res.status(404).type("application/json").send({
      response_code: "NOT_FOUND",
    });
    return;
  }

  // Merge default config and custom config
  const conf = merge(defaultConfigFromUtils, org);
  const {host, settings} = conf;
  const url = reverse("update_registration_method", getSlug(conf));
  const timeout = conf.timeout * 1000;
  const requestHeaders = req.headers || {};

  // Compute allowed methods from config
  const allowedMethods = [];
  if (settings && settings.subscriptions) {
    allowedMethods.push("bank_card");
  }
  if (settings && settings.mobile_phone_verification) {
    allowedMethods.push("mobile_phone");
  }

  // Validate method against allowed methods
  if (!allowedMethods.includes(req.body.method)) {
    res.status(400).type("application/json").send({
      response_code: "INVALID_METHOD",
    });
    return;
  }

  // Make AJAX request
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
      res.status(response.status).type("application/json").send(response.data);
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
};

export default updateRegistrationMethod;
