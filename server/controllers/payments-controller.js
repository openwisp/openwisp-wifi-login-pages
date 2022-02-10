import axios from "axios";
import merge from "deepmerge";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const payments = (req, res) => {
  const reqOrg = req.params.organization;
  const reqPaymentId = req.params.paymentId;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const paymentUrl = reverse("payment_status", getSlug(conf)).replace(
        "{paymentId}",
        reqPaymentId,
      );
      const timeout = conf.timeout * 1000;
      // make AJAX request
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": req.headers["accept-language"],
          Authorization: req.headers.authorization,
        },
        url: `${host}${paymentUrl}/`,
        timeout,
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

export default payments;
