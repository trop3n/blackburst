-- Blackburst — auth & project sharing schema.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Model: each project's full module bucket (the snapshotCurrent() output) is one
-- JSONB row in project_state. Access is by membership (project_members) with
-- ranked roles. RLS membership checks go through a SECURITY DEFINER helper so a
-- policy on project_members never recurses into itself.

-- ───────────────────────── roles ─────────────────────────
-- Enum order defines rank: viewer < editor < owner (compared with >=).
create type public.member_role as enum ('viewer', 'editor', 'owner');

-- ───────────────────────── tables ────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  updated_at   timestamptz not null default now()
);

create table public.projects (
  id         uuid primary key default gen_random_uuid(),
  code       text not null default '',
  name       text not null,
  client     text not null default '—',
  status     text not null default 'in-design',
  owner_id   uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.member_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.project_invites (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  email       text not null,
  role        public.member_role not null default 'editor',
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (project_id, email)
);

create table public.project_state (
  project_id uuid primary key references public.projects (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.project_revisions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  n          int not null,
  note       text not null default '',
  at         timestamptz not null default now(),
  author_id  uuid references auth.users (id) on delete set null
);
create index project_revisions_project_idx on public.project_revisions (project_id);

-- ─────────────── membership helper (recursion-safe) ───────────────
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member(pid uuid, min_role public.member_role default 'viewer')
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
      and m.role >= min_role
  );
$$;
grant execute on function private.is_member(uuid, public.member_role) to authenticated;

-- ───────────────────────── triggers ──────────────────────
-- One profile row per auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Project creator becomes its owner member (bypasses RLS as definer).
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

-- ─────────────── invite claim (called after sign-in) ───────────────
-- Converts every invite addressed to the caller's email into a membership.
create or replace function public.claim_invites()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed int;
begin
  insert into public.project_members (project_id, user_id, role)
  select i.project_id, auth.uid(), i.role
  from public.project_invites i
  where lower(i.email) = lower(auth.email())
    and i.accepted_at is null
  on conflict (project_id, user_id) do nothing;

  update public.project_invites i
    set accepted_at = now()
  where lower(i.email) = lower(auth.email())
    and i.accepted_at is null;

  get diagnostics claimed = row_count;
  return claimed;
end;
$$;
grant execute on function public.claim_invites() to authenticated;

-- ───────────────────────── RLS ───────────────────────────
alter table public.profiles          enable row level security;
alter table public.projects          enable row level security;
alter table public.project_members   enable row level security;
alter table public.project_invites   enable row level security;
alter table public.project_state     enable row level security;
alter table public.project_revisions enable row level security;

-- profiles: readable by any signed-in user (to show collaborators); self-write.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_upsert_self" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- projects: members read; owner-on-create insert; editor update; owner delete.
-- owner_id is included in SELECT so INSERT ... RETURNING works before the
-- membership trigger row is visible.
create policy "projects_select" on public.projects
  for select to authenticated using (owner_id = auth.uid() or private.is_member(id));
create policy "projects_insert" on public.projects
  for insert to authenticated with check (owner_id = auth.uid());
create policy "projects_update" on public.projects
  for update to authenticated using (private.is_member(id, 'editor')) with check (private.is_member(id, 'editor'));
create policy "projects_delete" on public.projects
  for delete to authenticated using (private.is_member(id, 'owner'));

-- project_members: members can read the roster; only owners change it; anyone
-- may remove their own row (leave a project).
create policy "members_select" on public.project_members
  for select to authenticated using (private.is_member(project_id));
create policy "members_insert" on public.project_members
  for insert to authenticated with check (private.is_member(project_id, 'owner'));
create policy "members_update" on public.project_members
  for update to authenticated using (private.is_member(project_id, 'owner')) with check (private.is_member(project_id, 'owner'));
create policy "members_delete" on public.project_members
  for delete to authenticated using (private.is_member(project_id, 'owner') or user_id = auth.uid());

-- project_invites: owners manage; invitees can see invites addressed to them.
create policy "invites_select" on public.project_invites
  for select to authenticated using (private.is_member(project_id, 'owner') or lower(email) = lower(auth.email()));
create policy "invites_insert" on public.project_invites
  for insert to authenticated with check (private.is_member(project_id, 'owner'));
create policy "invites_delete" on public.project_invites
  for delete to authenticated using (private.is_member(project_id, 'owner'));

-- project_state: members read; editors write.
create policy "state_select" on public.project_state
  for select to authenticated using (private.is_member(project_id));
create policy "state_insert" on public.project_state
  for insert to authenticated with check (private.is_member(project_id, 'editor'));
create policy "state_update" on public.project_state
  for update to authenticated using (private.is_member(project_id, 'editor')) with check (private.is_member(project_id, 'editor'));

-- project_revisions: members read; editors append.
create policy "revisions_select" on public.project_revisions
  for select to authenticated using (private.is_member(project_id));
create policy "revisions_insert" on public.project_revisions
  for insert to authenticated with check (private.is_member(project_id, 'editor'));

-- ───────────────────────── realtime ──────────────────────
-- Broadcast project_state changes so collaborators refresh without a reload.
-- RLS still applies: a client only receives rows it can SELECT.
alter publication supabase_realtime add table public.project_state;
