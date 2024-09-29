import merge from "deepmerge";

import config from "../config.json";
import defaultConfig from "../utils/default-config";
import {logResponseError} from "../utils/logger";
import reverse from "../utils/openwisp-urls";
import getSlug from "../utils/get-slug";


const paymentWsController = (req, res) => {
  console.log("this is beien calakjljal");
  const reqOrg = req.params.organization;
  const validSlug = config.some((org) => {
    if (org.slug === reqOrg) {
      // merge default config and custom config
      const conf = merge(defaultConfig, org);
      const {host} = conf;
      const url = reverse("payment_ws", getSlug(conf));
      console.log(url);
      const timeout = conf.timeout * 1000;
      const token = req.headers.authorization.split(" ");
      // make AJAX request

      // Create a new WebSocket instance
      const socket = new WebSocket(`${host.replace("http", "ws")}${url}`);

// Establish WebSocket connection
      socket.onopen = () => {
        console.log("WebSocket connection established");

        // Construct the message payload similar to your Axios request data
        const payload = {
          token,
          account: req.body.account,
          method: req.body.method,
          order: req.body.order,
        };

        // Optional: Include headers or additional config in the payload if needed
        const message = JSON.stringify({
          type: "initiate_payment",  // Specify an action type
          headers: {
            Authorization: req.headers.authorization,
            "accept-language": req.headers["accept-language"],
          },
          payload,
        });

        // Send the message over WebSocket
        socket.send(message);
      };

// Handle incoming messages from the server
      socket.onmessage = (event) => {
        console.log("Message received:", event.data);

        // Parse and handle the response message
        const response = JSON.parse(event.data);

        // Assuming the server sends a response status and data similar to Axios
        res
          .status(response.status)
          .type("application/json")
          .send(response.data);
      };

// Handle WebSocket errors
      socket.onerror = (error) => {
        logResponseError(error);
      };

// Handle WebSocket connection closure
      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };


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

export default paymentWsController;
