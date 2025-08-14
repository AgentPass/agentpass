/*
  Warnings:

  - You are about to rename the column `endpoint` on the `McpServer` table to `baseUrl`.

*/
-- AlterTable
ALTER TABLE "McpServer" ALTER COLUMN "endpoint" SET DEFAULT '';
ALTER TABLE "McpServer" RENAME COLUMN "endpoint" TO "baseUrl";
