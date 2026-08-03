-- Blackburst — global device registry.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Model: one row per piece of real-world equipment, shared org-wide and NOT tied
-- to any project. Devices used to live inside each project's JSONB bucket; they
-- were promoted out because a physical box outlives the project that specified
-- it, and its service history has to survive a project switch. `data` is the
-- client's Device record verbatim, so its generated `id` round-trips — rack
-- items, graph nodes and inventory assets all reference that id.

create table public.devices (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Lookups and writes all filter on the client-generated id inside `data`.
create unique index devices_data_id_idx on public.devices ((data ->> 'id'));

alter table public.devices enable row level security;

-- A shared operational record: any signed-in user may read it, add to it, and
-- correct it — a serial typo or a relabelled box should be fixable by whoever
-- notices, not only by whoever first entered it. Deletion stays with the
-- contributor, since removing a device orphans references to it from any
-- project that still uses it.
create policy "devices readable by authenticated"
  on public.devices for select
  to authenticated
  using (true);

create policy "devices insert by authenticated"
  on public.devices for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "devices update by authenticated"
  on public.devices for update
  to authenticated
  using (true)
  with check (true);

create policy "devices delete own"
  on public.devices for delete
  to authenticated
  using (created_by = auth.uid());

-- created_by is the key the delete policy tests, and the update policy is
-- deliberately open so anyone can correct a record. Without pinning the column,
-- a user could reassign a row to themselves and then delete it, which would make
-- "delete own" advisory rather than enforced. Shared by the venue tables in 0004.
create function public.freeze_created_by()
returns trigger
language plpgsql
as $$
begin
  new.created_by := old.created_by;
  return new;
end;
$$;

create trigger devices_freeze_created_by
  before update on public.devices
  for each row execute function public.freeze_created_by();
