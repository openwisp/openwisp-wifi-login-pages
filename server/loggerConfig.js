const logFilePath = {
  all: process.env.ALL_LOG_FILE || "log/all.log",
  error: process.env.ERROR_LOG_FILE || "log/error.log",
  warn: process.env.WARN_LOG_FILE || "log/warn.log",
  info: process.env.INFO_LOG_FILE || "log/info.log",
  http: process.env.HTTP_LOG_FILE || "log/http.log",
  debug: process.env.DEBUG_LOG_FILE || "log/debug.log",
};

export default logFilePath;
