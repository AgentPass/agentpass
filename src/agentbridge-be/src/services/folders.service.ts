import { Folder } from "@agentbridge/api";
import { Folder as FolderPrisma } from "@prisma/client";
import { Database } from "../utils/connection.js";

export const mapFolder = (folder: FolderPrisma): Folder => ({
  ...folder,
  parentFolderId: folder.parentFolderId || undefined,
  createdAt: folder.createdAt.toISOString(),
  updatedAt: folder.updatedAt.toISOString(),
});

export async function listFolders(db: Database, serverId: string, tenantId: string): Promise<Folder[]> {
  const folders = await db.folder.findMany({
    where: {
      serverId,
      tenantId,
    },
    orderBy: [
      {
        name: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
  return folders.map(mapFolder);
}

export async function createFolder(
  db: Database,
  serverId: string,
  tenantId: string,
  name: string,
  parentFolderId?: string,
): Promise<Folder> {
  const folder = await db.folder.create({
    data: {
      name,
      parentFolderId,
      tenantId,
      serverId,
    },
  });
  return mapFolder(folder);
}

export async function updateFolder(
  db: Database,
  folderId: string,
  serverId: string,
  tenantId: string,
  name: string,
): Promise<Folder> {
  const folder = await db.folder.update({
    where: {
      id: folderId,
      serverId,
      tenantId,
    },
    data: {
      name,
    },
  });
  return mapFolder(folder);
}

export async function deleteFolder(db: Database, folderId: string, serverId: string, tenantId: string): Promise<void> {
  await db.folder.delete({
    where: {
      id: folderId,
      serverId,
      tenantId,
    },
  });
}
