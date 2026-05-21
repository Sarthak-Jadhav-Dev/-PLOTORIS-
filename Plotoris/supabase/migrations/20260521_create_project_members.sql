-- Migration: Create Project Members table for RBAC

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  allowed_phases TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view members of projects they are in"
  ON project_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT pm.user_id FROM project_members pm WHERE pm.project_id = project_members.project_id
    )
  );

CREATE POLICY "Admins can manage project members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'ADMIN'
    )
  );

-- Trigger to automatically add project creator as ADMIN
CREATE OR REPLACE FUNCTION add_project_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, allowed_phases)
  VALUES (NEW.id, NEW.user_id, 'ADMIN', '{"p1","p2","p3","p4","p5","p6","p7","p8","p9","p10"}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assuming there is a 'projects' table, we attach the trigger
-- Uncomment and adjust if 'projects' table exists and needs this trigger:
-- CREATE TRIGGER on_project_created
--   AFTER INSERT ON projects
--   FOR EACH ROW EXECUTE FUNCTION add_project_creator_as_admin();
