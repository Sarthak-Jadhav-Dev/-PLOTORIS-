create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid references public.research_papers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- 'CREATED', 'MOVED'
  from_status text,
  to_status text,
  user_name text, -- Denormalized for display purposes
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.activity_logs enable row level security;

-- Policies for activity logs
create policy "allow select all activity_logs" on public.activity_logs for select using (true);
create policy "allow insert activity_logs" on public.activity_logs for insert with check (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table public.activity_logs with (publish = 'insert');
