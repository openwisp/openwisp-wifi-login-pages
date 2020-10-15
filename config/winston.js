import { createLogger, format, transports } from "winston";

const logger = new createLogger({
    level: 'info', // for error, warn and info logs
    format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.splat(),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
        format.printf((info) => (Object.keys(info.metadata).length
         ? `${info.timestamp} | [${info.level}] ${info.message} | ${JSON.stringify(info.metadata)}`
         : `${info.timestamp} | [${info.level}] ${info.message}`)),
    ),
    transports: [
      new transports.File({ filename: './logs/error.log', level: 'error' }),
    ],
    exitOnError: false
  });

export default logger;
