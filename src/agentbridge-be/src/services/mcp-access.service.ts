import { McpServer } from "@prisma/client";
import { Logger } from "winston";
import { APP_INSUFFICIENT_PERMISSIONS, APP_INVALID_SERVER } from "../types/error.types.js";
import { Database } from "../utils/connection.js";
import { CacheItemType, cacheGetOrAdd } from "./cache.service.js";

interface ServerAccessResult {
  userNotFound?: boolean;
  error?: {
    code: number;
    message: string;
  };
}

export async function validateServerAccess(
  db: Database,
  logger: Logger,
  serverId: string,
  userEmail: string,
): Promise<ServerAccessResult> {
  logger.debug(`Validating server access for user ${userEmail} and server ${serverId}`);

  return await cacheGetOrAdd<ServerAccessResult>(
    { type: CacheItemType.SERVER_ACCESS, ids: [serverId, userEmail] },
    async () => {
      const server = await cacheGetOrAdd<McpServer | null>(
        { type: CacheItemType.SERVER, ids: [serverId] },
        async () => {
          return await db.mcpServer.findFirst({
            where: {
              id: serverId,
            },
          });
        },
      );

      if (!server) {
        return {
          error: {
            code: APP_INVALID_SERVER,
            message: `Server not found: ${serverId}`,
          },
        };
      }

      if (!server.enabled) {
        return {
          error: {
            code: APP_INVALID_SERVER,
            message: `Server is not enabled: ${serverId}`,
          },
        };
      }

      logger.debug(`Looking for user with email: ${userEmail} and tenantId: ${server.tenantId}`);
      const user = await db.endUser.findFirst({
        where: {
          email: userEmail,
          tenantId: server.tenantId,
        },
        select: {
          id: true,
          enabled: true,
        },
      });
      if (!user) {
        return { userNotFound: true };
      }

      if (!user.enabled) {
        return {
          error: {
            code: APP_INSUFFICIENT_PERMISSIONS,
            message: `User ${userEmail} does not have access to server: ${serverId}`,
          },
        };
      }

      return {};
    },
  );
}
