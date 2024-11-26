import winston from "winston";
import { Config } from "./index";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "auth-service" },
  transports: [
    new winston.transports.File({
      dirname: "error",
      filename: "error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.prettyPrint(),
      ),
      silent: Config.NODE_ENV === "development",
    }),
    new winston.transports.Console({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.prettyPrint(),
      ),
      silent: Config.NODE_ENV === "development",
    }),
  ],
});
export default logger;
