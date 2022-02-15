import winston from "winston";
import SentryTransport from "winston-transport-sentry-node";
import logFilePath from "../loggerConfig";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  return isDevelopment ? "debug" : "warn";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "cyan",
  debug: "blue",
  http: "green",
};

winston.addColors(colors);

const format = winston.format.combine(
  /* eslint-disable no-param-reassign */
  winston.format((info) => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  /* eslint-enable no-param-reassign */
  winston.format.errors({stack: true}),
  winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss:ms"}),
  winston.format.colorize({all: true}),
  winston.format.printf((info) => {
    const log = `[${info.level} ${info.timestamp}] ${info.message}`;
    return info.stack ? `${log}\n${info.stack}` : log;
  }),
);

const transports = [
  new winston.transports.Console({
    handleExceptions: true,
    silent: false,
  }),
  new winston.transports.File({
    filename: logFilePath.error,
    level: "error",
  }),
  new winston.transports.File({
    filename: logFilePath.warn,
    level: "warn",
  }),
  new winston.transports.File({
    filename: logFilePath.info,
    level: "info",
  }),
  new winston.transports.File({
    filename: logFilePath.http,
    level: "http",
  }),
  new winston.transports.File({
    filename: logFilePath.debug,
    level: "debug",
  }),
  new winston.transports.File({filename: logFilePath.all}),
];

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.File({filename: logFilePath.error}),
  ],
  rejectionHandlers: [
    new winston.transports.File({filename: logFilePath.error}),
  ],
});

/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
try {
  const sentryConfig = require("../../sentry-env.json");
  Logger.add(
    new SentryTransport({
      sentry: sentryConfig.sentryTransportLogger.sentry,
      level: sentryConfig.sentryTransportLogger.level,
      levelsMap: sentryConfig.sentryTransportLogger.levelsMap,
      format: winston.format.combine(
        format,
        winston.format.uncolorize({raw: false}),
      ),
    }),
  );
} catch (error) {
  // no op
}

export const logResponseError = (error) => {
  try {
    if (error.response) {
      const {status, data, config} = error.response;
      if (status >= 500) Logger.error(error.response);
      else
        Logger.info(
          `Request to ${config.url} failed with ${status}:\n${JSON.stringify(
            data,
          )}`,
        );
    } else if (error.request) {
      // The request was made but no response was received
      Logger.error({error, request: error.request});
    } else Logger.error(error.message);
  } catch (err) {
    Logger.error(err);
  }
};

export default Logger;
