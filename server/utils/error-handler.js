import Logger from "./logger";

const errorHandler = (fn) => (req, res, next) => {
  try {
    fn(req, res, next);
  } catch (err) {
    Logger.error(err);
    res.status(500).type("application/json").send({
      response_code: "INTERNAL_SERVER_ERROR",
    });
  }
};

export default errorHandler;
