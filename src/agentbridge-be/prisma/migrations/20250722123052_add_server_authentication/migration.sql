-- CreateEnum
CREATE TYPE "ServerAuthType" AS ENUM ('BASE', 'JWT');

-- AlterTable
ALTER TABLE "McpServer" ADD COLUMN     "authConfigId" TEXT,
ADD COLUMN     "authType" "ServerAuthType" NOT NULL DEFAULT 'BASE';

-- CreateTable
CREATE TABLE "ServerJwtProvider" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jwksUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerJwtProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServerAuthConfig" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "authType" "ServerAuthType" NOT NULL DEFAULT 'BASE',
    "jwtProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServerAuthConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "McpServer_authConfigId_key" ON "McpServer"("authConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "ServerJwtProvider_serverId_name_key" ON "ServerJwtProvider"("serverId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ServerAuthConfig_serverId_key" ON "ServerAuthConfig"("serverId");

-- AddForeignKey
ALTER TABLE "ServerJwtProvider" ADD CONSTRAINT "ServerJwtProvider_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerJwtProvider" ADD CONSTRAINT "ServerJwtProvider_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerAuthConfig" ADD CONSTRAINT "ServerAuthConfig_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerAuthConfig" ADD CONSTRAINT "ServerAuthConfig_jwtProviderId_fkey" FOREIGN KEY ("jwtProviderId") REFERENCES "ServerJwtProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;