import axios from "axios";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";

const passwordChange = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const url = reverse("password_change", getSlug(conf));
      const timeout = conf.timeout * 1000;
      const {currentPassword, newPassword1, newPassword2} = req.body;
      const {authorization: token} = req.headers;
      if (token) {
        // make AJAX request
        axios({
          method: "post",
          headers: {
            "content-type": "application/json",
            Authorization: req.headers.authorization,
            "accept-language": req.headers["accept-language"],
          },
          url: `${host}${url}/`,
          timeout,
          data: {
            current_password: currentPassword,
            new_password: newPassword1,
            confirm_password: newPassword2,
          },
        })
          .then((response) => {
            // forward response
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
                detail: "Internal server error",
              });
            }
          });
      } else {
        res.status(401).type("application/json").send({
          detail: "Invalid Token",
        });
      }
    }
    return org.slug === reqOrg;
  });
  // return 404 for invalid organization slug or org not listed in config
  if (!validSlug) {
    res.status(404).type("application/json").send({
      detail: "Not found.",
    });
  }
};

export default passwordChange;
