import { Prisma, PrismaClient } from "@prisma/client";
import { fieldEncryptionExtension } from "prisma-field-encryption";
// eslint-disable-next-line no-restricted-imports
import logger from "../logger.js";
import { getAppSecrets } from "../services/secrets.service.js";
import { getRequestLogger } from "./logger-cls.js";
import QueryEvent = Prisma.QueryEvent;
import LogEvent = Prisma.LogEvent;

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

const auditLog = (model: string | undefined, operation: string, args: { data: Record<string, unknown> }) => {
  if (
    !model ||
    (!operation.startsWith("create") && !operation.startsWith("update") && !operation.startsWith("delete"))
  ) {
    return;
  }
  const id = args["data"]?.["id"];
  const name = args["data"]?.["name"];
  const keys = Object.keys(args["data"] || {});
  getRequestLogger()?.info("DB Audit Log", {
    model,
    operation,
    id,
    name,
    keys,
  });
};

prisma.$on("query", (e: QueryEvent) => {
  logger.debug("Query:", {
    query: e.query,
    duration: e.duration,
    timestamp: e.timestamp,
  });
});

prisma.$on("error", (e: LogEvent) => {
  logger.error("Database error:", {
    error: e.message,
    timestamp: e.timestamp,
  });
});

prisma.$on("warn", (e: LogEvent) => {
  logger.warn("Database warning:", {
    warning: e.message,
    timestamp: e.timestamp,
  });
});

prisma.$on("info", (e: LogEvent) => {
  logger.debug("Database info:", {
    info: e.message,
    timestamp: e.timestamp,
  });
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export type Database = typeof prisma;

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.debug("Database connection closed");
  } catch (error) {
    logger.error("Error disconnecting from database", error);
  }
};

export default (async () => {
  const secrets = await getAppSecrets();
  return prisma
    .$extends(
      fieldEncryptionExtension({
        encryptionKey: secrets.dbEncryptionKey,
      }),
    )
    .$extends({
      name: "auditLog",
      query: {
        $allOperations({ model, operation, args, query }) {
          const res = query(args);
          auditLog(model, operation, args);
          return res;
        },
      },
    }) as Database;
})();
