import winston from "winston";
const logger = new winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    ],
    exitOnError: false
  });
export default logger;