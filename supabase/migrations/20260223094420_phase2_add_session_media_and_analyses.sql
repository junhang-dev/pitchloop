alter table public.sessions
  add column if not exists media_path text,
  add column if not exists media_mime text,
  add column if not exists media_size bigint,
  add column if not exists duration_sec int,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  speaking_rate_wpm int,
  filler_json jsonb,
  pauses_json jsonb,
  feedback_json jsonb,
  transcript_text text,
  is_estimated boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.analyses enable row level security;

create policy "Analyses are user scoped" on public.analyses
  for all
  using (
    exists (
      select 1
      from public.sessions
      join public.projects on public.projects.id = public.sessions.project_id
      where public.sessions.id = public.analyses.session_id
        and public.projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sessions
      join public.projects on public.projects.id = public.sessions.project_id
      where public.sessions.id = public.analyses.session_id
        and public.projects.user_id = auth.uid()
    )
  );
