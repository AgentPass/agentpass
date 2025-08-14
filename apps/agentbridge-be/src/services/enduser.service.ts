import { Database } from "../utils/connection.js";

const getServerById = async (db: Database, serverId: string) =>
  await db.mcpServer.findUnique({
    where: {
      id: serverId,
    },
  });

export async function createEndUserIfNotExists(db: Database, tenantId: string, email: string) {
  return db.endUser.upsert({
    where: {
      email_tenantId: {
        email: email.toLowerCase(),
        tenantId: tenantId,
      },
    },
    update: {},
    create: {
      email: email.toLowerCase(),
      tenantId: tenantId,
      enabled: true,
    },
  });
}

export async function setEndUserOwnIdData(db: Database, serverId: string, email: string, ownIdData: string) {
  const server = await getServerById(db, serverId);

  if (!server) {
    return { status: "NOT_FOUND", error: "Server not found" };
  }

  await db.endUser.upsert({
    where: {
      email_tenantId: {
        email: email.toLowerCase(),
        tenantId: server.tenantId,
      },
    },
    update: {
      ownidData: ownIdData,
    },
    create: {
      email: email.toLowerCase(),
      tenantId: server.tenantId,
      ownidData: ownIdData,
      enabled: true,
    },
  });

  return { status: "NO_CONTENT" };
}

export async function getEndUserOwnIdData(db: Database, serverId: string, email: string) {
  const server = await getServerById(db, serverId);

  if (!server) {
    return { status: "NOT_FOUND", error: "Server not found" };
  }

  const user = await db.endUser.findUnique({
    where: {
      email_tenantId: {
        email: email.toLowerCase(),
        tenantId: server.tenantId,
      },
    },
  });

  if (!user) {
    return { status: "NO_CONTENT" };
  }

  if (!user.enabled) {
    return { status: "LOCKED", error: "User not enabled" };
  }

  if (user.ownidData) {
    return { status: "OK", data: { ownIdData: user.ownidData } };
  }

  return { status: "NO_CONTENT" };
}

export async function createEndUserSession(
  db: Database,
  serverId: string,
  email: string,
  createToken: () => Promise<string>,
) {
  const server = await getServerById(db, serverId);

  if (!server) {
    return { status: "NOT_FOUND", error: "Server not found" };
  }

  await db.endUser.upsert({
    where: {
      email_tenantId: {
        email: email.toLowerCase(),
        tenantId: server.tenantId,
      },
    },
    update: {},
    create: {
      email: email.toLowerCase(),
      emailVerified: true,
      tenantId: server.tenantId,
      enabled: true,
    },
  });

  return { status: "OK", data: { token: await createToken() } };
}

export const getEndUserByEmailAndServerId = async (db: Database, email: string, serverId: string) => {
  const server = await getServerById(db, serverId);
  if (!server) {
    return null;
  }
  return await db.endUser.findUnique({
    where: {
      email_tenantId: {
        email: email.toLowerCase(),
        tenantId: server.tenantId,
      },
    },
  });
};
