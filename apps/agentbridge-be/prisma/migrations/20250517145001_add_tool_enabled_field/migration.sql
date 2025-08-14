-- Migration: Add enabled field to Tool table
-- This migration adds an 'enabled' field to the Tool table with a default value of true

ALTER TABLE "Tool" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

-- Update existing tools to be enabled by default
UPDATE "Tool" SET "enabled" = true WHERE "enabled" IS NULL;