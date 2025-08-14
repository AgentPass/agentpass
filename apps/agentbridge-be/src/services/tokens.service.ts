import { ProviderToken } from "@agentbridge/api";
import { ProviderToken as PrismaProviderToken } from "@prisma/client";
import { Database } from "../utils/connection.js";
import { CacheItemType, clearCacheByPartialKey } from "./cache.service.js";

export const mapToken = (token: PrismaProviderToken & { provider: { id: string; name: string } }): ProviderToken => ({
  id: token.id,
  providerId: token.provider.id,
  providerName: token.provider.name,
  scopes: token.scopes,
  issuedAt: token.issuedAt.toISOString(),
  expiresAt: token.expiresAt ? token.expiresAt.toISOString() : undefined,
});

export async function listUserTokens(
  db: Database,
  userId: string,
  tenantId: string,
  options: {
    includeExpired?: boolean;
    providerName?: string;
    scope?: string;
  },
): Promise<ProviderToken[]> {
  const now = new Date();

  const tokens = await db.providerToken.findMany({
    where: {
      userId: userId,
      user: {
        tenantId,
      },
      ...(options.includeExpired !== true ? { OR: [{ expiresAt: { gte: now } }, { expiresAt: null }] } : {}),
      ...(options.providerName ? { provider: { name: options.providerName } } : {}),
      ...(options.scope ? { scopes: { has: options.scope } } : {}),
    },
    orderBy: [
      {
        provider: {
          name: "asc",
        },
      },
      {
        id: "asc",
      },
    ],
    include: {
      provider: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return tokens
    .filter((token): token is PrismaProviderToken & { provider: { id: string; name: string } } =>
      Boolean(token.provider),
    )
    .map(mapToken);
}

export async function verifyUserExists(db: Database, userId: string, tenantId: string): Promise<boolean> {
  const user = await db.endUser.findUnique({
    where: {
      id: userId,
      tenantId,
    },
  });

  return !!user;
}

export async function getUserByIdSlim(db: Database, userId: string, tenantId: string) {
  return await db.endUser.findUnique({
    where: {
      id: userId,
      tenantId,
    },
    select: {
      id: true,
      email: true,
    },
  });
}

export async function revokeToken(db: Database, tokenId: string, userId: string): Promise<void> {
  await db.providerToken.delete({
    where: {
      id: tokenId,
      userId: userId,
    },
  });
}

export async function deleteUserTokens(db: Database, userId: string): Promise<string | null> {
  await db.providerToken.deleteMany({
    where: {
      userId: userId,
    },
  });

  return null;
}

export async function clearUserTokenCache(email: string): Promise<void> {
  clearCacheByPartialKey(CacheItemType.ENDUSER_TOKEN, email);
}
