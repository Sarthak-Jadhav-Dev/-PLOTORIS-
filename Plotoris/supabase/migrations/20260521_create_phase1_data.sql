-- Create a table to store structured JSON data from Phase 1
CREATE TABLE IF NOT EXISTS phase1_data (
  project_id TEXT PRIMARY KEY,
  problem JSONB,
  question JSONB,
  scope JSONB,
  objectives JSONB,
  summary TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Note: Because this is an AI assistant app, and we're currently relying on the backend APIs
-- using the service role or anon key to handle inserts directly, we will ensure that RLs are
-- configured if row level security is enabled, but for now we keep it simple.

-- Enable RLS (optional depending on your current setup, uncomment if needed)
-- ALTER TABLE phase1_data ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations for phase1" ON phase1_data FOR ALL USING (true);
