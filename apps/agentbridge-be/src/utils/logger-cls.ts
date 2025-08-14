import { createNamespace } from "cls-hooked";
import { Logger } from "winston";

const requestLoggerNamespace = createNamespace("req-logger");
const requestLoggerKey = "logger";

export const withRequestLogger = (logger: Logger, action: () => unknown) => {
  requestLoggerNamespace.run(() => {
    requestLoggerNamespace.set(requestLoggerKey, logger);
    action();
  });
};

export const getRequestLogger = () => {
  return requestLoggerNamespace.get(requestLoggerKey) as Logger | null;
};
