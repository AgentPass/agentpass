import tracer from "dd-trace";
import winston from "winston";
import { isLocalRun } from "./utils/config.js";

tracer.init({
  logInjection: true,
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.errors({ stack: true }),
  ),
  transports: [
    new winston.transports.Console({
      format: isLocalRun ? winston.format.combine(winston.format.colorize(), winston.format.simple()) : undefined,
    }),
  ],
});

export default logger;
