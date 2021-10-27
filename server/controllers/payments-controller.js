import axios from "axios";
import merge from "deepmerge";
import cookie from "cookie-signature";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import Logger from "../utils/logger";
import reverse from "../utils/openwisp-urls";

const payments = (req, res) => {
  const reqOrg = req.params.organization;
  const reqPaymentId = req.params.paymentId;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host, custom, radiusSlug} = conf;
      const paymentUrl = reverse(
        "payment_status",
        custom ? radiusSlug : org.slug,
      ).replace("{paymentId}", reqPaymentId);
      const timeout = conf.timeout * 1000;
      const {tokenType, session} = req.body;
      let {tokenValue} = req.body;
      if (session === "false")
        tokenValue = cookie.unsign(tokenValue, conf.secret_key);
      // make AJAX request
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "accept-language": req.headers["accept-language"],
          Authorization: `${tokenType} ${tokenValue}`,
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
          if (error.response && error.response.status === 500)
            Logger.error(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            Logger.error(error);
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
