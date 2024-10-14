import axios from "axios";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const buyPlan = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const url = reverse("buy_plan", getSlug(conf));
      const timeout = conf.timeout * 1000;
      const token = req.headers.authorization.split(" ");
      // make AJAX request
      axios({
        method: "post",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: req.headers.authorization,
          "accept-language": req.headers["accept-language"],
        },
        url: `${host}${url}/`,
        timeout,
        data: {
          phone_number: req.body.phone_number,
          plan_pricing: req.body.plan_pricing,
          voucher: req.body.voucher,
          requires_payment: req.body.requires_payment,
          method: req.body.method,
        },
      })
        .then((response) => {
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
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

export default buyPlan;
