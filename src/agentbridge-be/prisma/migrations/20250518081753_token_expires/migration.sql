-- DropIndex
DROP INDEX "ProviderToken_userId_providerId_key";

-- AlterTable
ALTER TABLE "ProviderToken" ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX ProviderToken_userId_providerId_key
  ON "ProviderToken"("userId", "providerId")
  WHERE "providerId" IS NOT NULL;
