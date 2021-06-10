import winston from "winston";
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
  winston.format.errors({stack: true}),
  winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss:ms"}),
  winston.format.colorize({all: true}),
  winston.format.printf((info) => {
    const log = `[ ${info.level} ${info.timestamp} ] ${info.message}`;
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

export default Logger;
