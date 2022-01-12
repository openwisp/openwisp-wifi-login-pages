import axios from "axios";
import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import Logger from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";
import sendCookies from "../utils/send-cookies";

const registration = (req, res) => {
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host, settings} = conf;
      const registerUrl = reverse("registration", getSlug(conf));
      const timeout = conf.timeout * 1000;
      const postData = req.body;
      const {username} = postData;

      if (settings && settings.mobile_phone_verification) {
        postData.phone_number = req.body.phone_number;
        postData.method = "mobile_phone";
      } else {
        delete postData.phone_number;
        postData.method = "";
      }
      if (settings && settings.subscriptions && postData.requires_payment) {
        postData.method = "bank_card";
        delete postData.requires_payment;
      }

      const optionalFields = [
        "first_name",
        "last_name",
        "location",
        "birth_date",
        "method",
      ];
      optionalFields.forEach((value) => {
        if (!postData[value]) {
          delete postData[value];
        }
      });

      // send request
      axios({
        method: "post",
        headers: {
          "content-type": "application/json",
          "accept-language": req.headers["accept-language"],
        },
        url: `${host}${registerUrl}/`,
        timeout,
        data: postData,
      })
        .then((response) => sendCookies(response, conf, res, username))
        .catch((error) => {
          Logger.error(error);
          // forward error
          try {
            res
              .status(error.response.status)
              .type("application/json")
              .send(error.response.data);
          } catch (err) {
            Logger.error(err);
            res.status(500).type("application/json").send({
              detail: "Internal server error",
            });
          }
        });
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

export default registration;
