create table research_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null check (status in ('Drafting', 'Pre-print', 'Submitted', 'Under Review', 'Accepted')),
  user_id uuid references auth.users (id) on delete cascade,
  updated_at timestamp with time zone default now()
);

-- Enable row level security (optional)
alter table research_papers enable row level security;

-- Policy: allow users to select their own papers
create policy "allow select own" on research_papers for select using (auth.uid() = user_id);

-- Policy: allow insert for authenticated users
create policy "allow insert" on research_papers for insert with check (auth.uid() = user_id);

-- Policy: allow update of own papers
create policy "allow update own" on research_papers for update using (auth.uid() = user_id);
