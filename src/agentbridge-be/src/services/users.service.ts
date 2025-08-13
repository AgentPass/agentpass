import { User } from "@agentbridge/api";
import { EndUser } from "@prisma/client";
import { DEFAULT_PAGE_SIZE } from "../utils/config.js";
import { Database } from "../utils/connection.js";

const mapUser = (user: EndUser): User => ({
  ...user,
  picture: user.picture || undefined,
  createdAt: user.createdAt.toISOString(),
});

export async function listUsers(db: Database, tenantId: string, search?: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  const users = await db.endUser.findMany({
    where: {
      tenantId,
      ...(search ? { email: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalUsers = await db.endUser.count({
    where: {
      tenantId,
      ...(search ? { email: { contains: search, mode: "insensitive" } } : {}),
    },
  });

  const totalPages = Math.ceil(totalUsers / limit);

  return {
    data: users.map(mapUser),
    pagination: {
      totalItems: totalUsers,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    },
  };
}

export async function getUser(db: Database, userId: string, tenantId: string) {
  const user = await db.endUser.findUnique({
    where: {
      id: userId,
      tenantId,
    },
  });
  return user ? mapUser(user) : null;
}

export async function blockUserServerAccess(db: Database, userId: string, tenantId: string, blocked: boolean) {
  return db.endUser.updateMany({
    where: { id: userId, tenantId },
    data: { enabled: !blocked },
  });
}
