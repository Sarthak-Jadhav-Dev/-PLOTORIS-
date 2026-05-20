-- ============================================================
-- PLOTORIS — Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Users" (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_name           TEXT NOT NULL,
    email               TEXT NOT NULL UNIQUE,
    password            TEXT NOT NULL,
    profession          TEXT,
    education           TEXT,
    fields_of_interest  TEXT[],
    avatar_url          TEXT,
    is_verified         BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public."Users"(email);

-- ============================================================
-- Projects Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Projects" (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    category    TEXT DEFAULT 'General',
    color       TEXT DEFAULT '#FF6B00',
    owner_id    UUID NOT NULL REFERENCES public."Users"(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public."Projects"(owner_id);

-- ============================================================
-- Project Members Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."ProjectMembers" (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES public."Projects"(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public."Users"(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'Contributor',
    status          TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'accepted' | 'declined'
    invited_by      UUID REFERENCES public."Users"(id),
    responded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_project ON public."ProjectMembers"(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_user    ON public."ProjectMembers"(user_id);

-- ============================================================
-- Notifications Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Notifications" (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES public."Users"(id) ON DELETE CASCADE,
    type        TEXT NOT NULL DEFAULT 'info',   -- 'invitation' | 'info' | 'alert'
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    metadata    JSONB DEFAULT '{}',
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_user    ON public."Notifications"(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread  ON public."Notifications"(user_id, is_read);

-- ============================================================
-- Row Level Security — allow anon key (used by Next.js routes)
-- ============================================================

ALTER TABLE public."Users"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Projects"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProjectMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Notifications"  ENABLE ROW LEVEL SECURITY;

-- Users: anon can insert (register) and read (login/search)
CREATE POLICY "anon_insert_users"  ON public."Users" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_users"  ON public."Users" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_users"  ON public."Users" FOR UPDATE TO anon USING (true);

-- Projects: full anon access (auth handled at API layer)
CREATE POLICY "anon_all_projects"  ON public."Projects"       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_members"   ON public."ProjectMembers" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_notifs"    ON public."Notifications"  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Auto update_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at    BEFORE UPDATE ON public."Users"    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public."Projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Project Tasks Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."ProjectTasks" (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES public."Projects"(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    sub             TEXT,
    badge           TEXT,
    badge_color     TEXT,
    completed       BOOLEAN DEFAULT FALSE,
    assigned_to     UUID REFERENCES public."Users"(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ptasks_project ON public."ProjectTasks"(project_id);
ALTER TABLE public."ProjectTasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_ptasks" ON public."ProjectTasks" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE TRIGGER set_ptasks_updated_at BEFORE UPDATE ON public."ProjectTasks" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Project Activity Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."ProjectActivity" (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES public."Projects"(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES public."Users"(id),
    user_name       TEXT NOT NULL,
    action          TEXT NOT NULL,
    color           TEXT DEFAULT 'bg-[#3b82f6]',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pactivity_project ON public."ProjectActivity"(project_id);
ALTER TABLE public."ProjectActivity" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_pactivity" ON public."ProjectActivity" FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Papers Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Papers" (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES public."Projects"(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    authors         TEXT[],
    publication_date DATE,
    doi             TEXT,
    abstract        TEXT,
    file_url        TEXT,
    uploaded_by     UUID REFERENCES public."Users"(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_papers_project ON public."Papers"(project_id);
CREATE INDEX IF NOT EXISTS idx_papers_uploader ON public."Papers"(uploaded_by);

-- ============================================================
-- Insights Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Insights" (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES public."Projects"(id) ON DELETE CASCADE,
    paper_id        UUID REFERENCES public."Papers"(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    type            TEXT DEFAULT 'general', -- 'general', 'methodology', 'finding', 'gap'
    created_by      UUID REFERENCES public."Users"(id),
    is_reviewed     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_project ON public."Insights"(project_id);
CREATE INDEX IF NOT EXISTS idx_insights_paper ON public."Insights"(paper_id);

-- ============================================================
-- Tasks Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public."Tasks" (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id      UUID NOT NULL REFERENCES public."Projects"(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    assigned_to     UUID REFERENCES public."Users"(id),
    status          TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    priority        TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    due_date        DATE,
    completed       BOOLEAN DEFAULT FALSE,
    created_by      UUID REFERENCES public."Users"(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public."Tasks"(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public."Tasks"(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public."Tasks"(status);

-- ============================================================
-- Row Level Security for new tables
-- ============================================================
ALTER TABLE public."Papers"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Insights"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Tasks"     ENABLE ROW LEVEL SECURITY;

-- Full anon access for new tables (auth handled at API layer)
CREATE POLICY "anon_all_papers"   ON public."Papers"   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_insights" ON public."Insights" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_tasks"    ON public."Tasks"    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Auto update_at triggers for new tables
-- ============================================================
CREATE TRIGGER set_papers_updated_at   BEFORE UPDATE ON public."Papers"   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_insights_updated_at BEFORE UPDATE ON public."Insights" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_tasks_updated_at    BEFORE UPDATE ON public."Tasks"    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
