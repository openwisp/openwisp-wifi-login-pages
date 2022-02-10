import axios from "axios";
import merge from "deepmerge";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const getUserRadiusSessions = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const userRadiusSessionsUrl = reverse(
        "user_radius_sessions",
        getSlug(conf),
      );
      const timeout = conf.timeout * 1000;
      // make AJAX request
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: req.headers.authorization,
          "accept-language": req.headers["accept-language"],
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

export default getUserRadiusSessions;
