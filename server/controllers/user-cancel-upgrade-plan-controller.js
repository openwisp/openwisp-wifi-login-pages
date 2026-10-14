import axios from "axios";
import merge from "deepmerge";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const userCancelUpgradePlan = (req, res) => {
  const reqOrg = req.params.organization;
  const org = config.find((item) => item.slug === reqOrg);
  if (!org) {
    return res.status(404).type("application/json").send({
      response_code: "NOT_FOUND",
    });
  }

  const conf = merge(defaultConfig, org);
  const {host} = conf;
  const userUpgradeCancelUrl = reverse(
    "user_plan_radius_usage_cancel",
    getSlug(conf),
  );
  const timeout = conf.timeout * 1000;
  return axios({
    method: "post",
    headers: {
      "content-type": "application/json",
      Authorization: req.headers.authorization,
      "accept-language": req.headers["accept-language"],
    },
    url: `${host}${userUpgradeCancelUrl}`,
    timeout,
  })
    .then((response) =>
      res.status(response.status).type("application/json").send(response.data),
    )
    .catch((error) => {
      logResponseError(error);
      try {
        return res
          .status(error.response.status)
          .type("application/json")
          .send(error.response.data);
      } catch (err) {
        return res.status(500).type("application/json").send({
          response_code: "INTERNAL_SERVER_ERROR",
        });
      }
    });
};

export default userCancelUpgradePlan;
