import axios from "axios";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";
import sendSessionCookies from "../utils/send-session-cookies";
import qs from "qs";

const ValidatePaymentId = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const url = reverse("validate_payment_id", getSlug(conf));
      const timeout = conf.timeout * 1000;

      const headersData = {
        "content-type": "application/x-www-form-urlencoded",
        "accept-language": req.headers["accept-language"],
      };

      if (req.headers && req.headers.authorization) {
        headersData.Authorization = req.headers.authorization;
      } else if (req.headers && req.headers.cookie) {
        headersData.Cookie = req.headers.cookie;
      }


      // make AJAX request
      axios({
        method: "post",
        headers: headersData,
        url: `${host}${url}/`,
        timeout,
        withCredentials: true,
        data: qs.stringify({
          account: req.body.phone_number,
          payment_id: req.body.payment_id,
        }),
      })
        .then((response) => sendSessionCookies(response, conf, res))
        .catch((error) => {
          logResponseError(error);
          // forward error
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
      response_code: "INTERNAL_SERVER_ERROR",
    });
  }
};

export default ValidatePaymentId;
