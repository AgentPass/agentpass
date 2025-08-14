-- DropForeignKey
ALTER TABLE "Tool" DROP CONSTRAINT "Tool_folderId_fkey";

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
