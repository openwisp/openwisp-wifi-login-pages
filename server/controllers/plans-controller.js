import axios from "axios";
import merge from "deepmerge";
import config from "../config.json";
import defaultConfig from "../utils/default-config";
import Logger from "../utils/logger";

const plans = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      let plansUrl = conf.proxy_urls.plans;
      // replacing org_slug param with the slug
      plansUrl = plansUrl.replace("{org_slug}", org.slug);
      const timeout = conf.timeout * 1000;
      // make AJAX request
      axios({
        method: "get",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        url: `${host}${plansUrl}/`,
        timeout,
      })
        .then((response) => {
          res
            .status(response.status)
            .type("application/json")
            .send(response.data);
        })
        .catch((error) => {
          console.log(error);
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

export default plans;
