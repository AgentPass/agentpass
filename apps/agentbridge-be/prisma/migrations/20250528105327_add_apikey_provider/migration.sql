/*
  Warnings:

  - You are about to drop the column `providerId` on the `Tool` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tool" DROP CONSTRAINT "Tool_providerId_fkey";

-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "providerId",
ADD COLUMN     "apiKeyProviderId" TEXT,
ADD COLUMN     "oAuthProviderId" TEXT;

-- CreateTable
CREATE TABLE "ApiKeyProvider" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "value" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "keyIn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKeyProvider_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_oAuthProviderId_fkey" FOREIGN KEY ("oAuthProviderId") REFERENCES "OAuthProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_apiKeyProviderId_fkey" FOREIGN KEY ("apiKeyProviderId") REFERENCES "ApiKeyProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKeyProvider" ADD CONSTRAINT "ApiKeyProvider_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
