const logFilePath = {
  all: process.env.ALL_LOG_FILE || "logs/all.log",
  error: process.env.ERROR_LOG_FILE || "logs/error.log",
  warn: process.env.WARN_LOG_FILE || "logs/warn.log",
  info: process.env.INFO_LOG_FILE || "logs/info.log",
  http: process.env.HTTP_LOG_FILE || "logs/http.log",
  debug: process.env.DEBUG_LOG_FILE || "logs/debug.log",
};

export default logFilePath;
