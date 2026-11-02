import axios from "axios";
import merge from "deepmerge";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

// Same format as the "uuid" path converter of the upstream Django route.
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const paymentGateway = (req, res) => {
  const org = config.find((item) => item.slug === req.params.organization);
  // return 404 for invalid organization slug or org not listed in config
  if (!org) {
    return res.status(404).type("application/json").send({
      response_code: "NOT_FOUND",
    });
  }
  // reject ids that are not UUIDs so that the upstream URL cannot be altered
  if (!uuidPattern.test(req.params.paymentId)) {
    return res.status(400).type("application/json").send({
      response_code: "INVALID_PAYMENT_ID",
    });
  }
  const conf = merge(defaultConfig, org);
  const paymentUrl = reverse("payment_gateway", getSlug(conf)).replace(
    "{paymentId}",
    req.params.paymentId,
  );
  const request = {
    method: req.method.toLowerCase(),
    headers: {
      "content-type": "application/json",
      Authorization: req.headers.authorization,
      "accept-language": req.headers["accept-language"],
    },
    url: `${conf.host}${paymentUrl}/`,
    timeout: conf.timeout * 1000,
  };
  if (request.method === "patch") {
    request.data = {gateway: req.body.gateway};
  }
  return (
    axios(request)
      // forward the upstream response
      .then((response) =>
        res
          .status(response.status)
          .type("application/json")
          .send(response.data),
      )
      .catch((error) => {
        logResponseError(error);
        try {
          // forward the upstream error
          return res
            .status(error.response.status)
            .type("application/json")
            .send(error.response.data);
        } catch (err) {
          // the upstream did not respond
          return res.status(500).type("application/json").send({
            response_code: "INTERNAL_SERVER_ERROR",
          });
        }
      })
  );
};

export default paymentGateway;
