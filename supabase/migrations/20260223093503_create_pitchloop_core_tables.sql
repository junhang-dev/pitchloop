create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  goal text not null,
  audience text not null,
  duration_sec int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  text text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.sessions enable row level security;
alter table public.actions enable row level security;

create policy "Projects are user scoped" on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Sessions are user scoped" on public.sessions
  for all
  using (
    exists (
      select 1
      from public.projects
      where public.projects.id = public.sessions.project_id
        and public.projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.projects
      where public.projects.id = public.sessions.project_id
        and public.projects.user_id = auth.uid()
    )
  );

create policy "Actions are user scoped" on public.actions
  for all
  using (
    exists (
      select 1
      from public.sessions
      join public.projects on public.projects.id = public.sessions.project_id
      where public.sessions.id = public.actions.session_id
        and public.projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sessions
      join public.projects on public.projects.id = public.sessions.project_id
      where public.sessions.id = public.actions.session_id
        and public.projects.user_id = auth.uid()
    )
  );
