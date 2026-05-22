-- Migration: Fix ProjectMembers table for proper RBAC
-- This patches the existing ProjectMembers table to:
-- 1. Allow NULL in allowed_phases (NULL = full access for Owner/Admin)
-- 2. Add 'Owner' as a valid role
-- 3. Add invited_by and status columns if missing
-- 4. Add index for faster lookups

-- Add allowed_phases column if it doesn't exist (NULL means unrestricted for Owner/Admin)
ALTER TABLE "ProjectMembers"
  ADD COLUMN IF NOT EXISTS allowed_phases TEXT[] DEFAULT NULL;

-- Normalize existing role values before applying the new constraint
UPDATE "ProjectMembers" SET role = 'Owner' WHERE UPPER(role) = 'OWNER';
UPDATE "ProjectMembers" SET role = 'Admin' WHERE UPPER(role) = 'ADMIN';
UPDATE "ProjectMembers" SET role = 'Member' WHERE UPPER(role) = 'MEMBER';

-- Catch-all for any weird values (e.g., 'Lead Researcher', null, empty string)
UPDATE "ProjectMembers" SET role = 'Member' WHERE role NOT IN ('Owner', 'Admin', 'Member');

-- Update role check to include proper capitalization
ALTER TABLE "ProjectMembers"
  DROP CONSTRAINT IF EXISTS "ProjectMembers_role_check";

ALTER TABLE "ProjectMembers"
  ADD CONSTRAINT "ProjectMembers_role_check"
  CHECK (role IN ('Owner', 'Admin', 'Member'));

-- Add status column if not exists
ALTER TABLE "ProjectMembers"
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'
  CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Add invited_by column if not exists
ALTER TABLE "ProjectMembers"
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES "Users"(id) ON DELETE SET NULL;

-- Set existing Owner rows: allowed_phases = NULL (full access)
UPDATE "ProjectMembers"
  SET allowed_phases = NULL
  WHERE role = 'Owner' OR role = 'Admin';

-- Index for faster member lookups
CREATE INDEX IF NOT EXISTS idx_project_members_project_user
  ON "ProjectMembers"(project_id, user_id);
