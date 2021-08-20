import fs from "fs";

import {JSDOM} from "jsdom";
import marked from "marked";
import path from "path";
import DOMPurify from "dompurify";
import config from "../config.json";
import Logger from "../utils/logger";

const {window} = new JSDOM("");
const dompurify = DOMPurify(window);

const modalContent = (req, res) => {
  const reqOrg = req.params.organization;
  const {file} = req.query;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      try {
        const data = dompurify.sanitize(
          marked(
            fs.readFileSync(
              path.join(
                path.join(
                  path.join(path.resolve(__dirname, ".."), "assets"),
                  reqOrg,
                ),
                file,
              ),
              "utf8",
            ),
          ),
        );
        res.status(200).type("application/json").send({
          __html: data,
        });
      } catch (err) {
        Logger.error(`${file} not found`, err);
        res.status(200).type("application/json").send({
          __html: "",
        });
      }
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

export default modalContent;
