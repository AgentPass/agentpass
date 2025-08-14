/*
  Warnings:

  - Changed the type of `keyIn` on the `ApiKeyProvider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ApiKeyLocation" AS ENUM ('header', 'query', 'cookie');

-- AlterTable
ALTER TABLE "ApiKeyProvider" DROP COLUMN "keyIn",
ADD COLUMN     "keyIn" "ApiKeyLocation" NOT NULL;
