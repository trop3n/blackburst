-- Blackburst — venues and their maintenance log.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- Requires 0003_devices.sql (entries reference a device id from that registry).
--
-- Model: a venue is a physical place with a permanent install, global and not
-- tied to any project — several projects can touch the same room over years, so
-- the service history is keyed to the place, not the job. A maintenance entry is
-- one logged intervention against one device at one venue. Both follow the same
-- shape as the other shared layers: `data` is the client record verbatim, so its
-- generated `id` round-trips and writes filter on `data->>id`.

create table public.venues (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index venues_data_id_idx on public.venues ((data ->> 'id'));

create table public.maintenance_entries (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index maintenance_entries_data_id_idx
  on public.maintenance_entries ((data ->> 'id'));

-- The log is filtered by venue on every read, so index that lookup.
create index maintenance_entries_venue_idx
  on public.maintenance_entries ((data ->> 'venueId'));

alter table public.venues enable row level security;
alter table public.maintenance_entries enable row level security;

-- Shared operational records, same policy shape as public.devices: any signed-in
-- user may read, add and correct; deletion stays with the contributor. A service
-- history is written by whoever did the work and read by the whole team, so
-- restricting edits to the original author would block routine corrections.
create policy "venues readable by authenticated"
  on public.venues for select to authenticated using (true);

create policy "venues insert by authenticated"
  on public.venues for insert to authenticated with check (created_by = auth.uid());

create policy "venues update by authenticated"
  on public.venues for update to authenticated using (true) with check (true);

create policy "venues delete own"
  on public.venues for delete to authenticated using (created_by = auth.uid());

create policy "maintenance readable by authenticated"
  on public.maintenance_entries for select to authenticated using (true);

create policy "maintenance insert by authenticated"
  on public.maintenance_entries for insert to authenticated with check (created_by = auth.uid());

create policy "maintenance update by authenticated"
  on public.maintenance_entries for update to authenticated using (true) with check (true);

create policy "maintenance delete own"
  on public.maintenance_entries for delete to authenticated using (created_by = auth.uid());

-- Same reasoning as devices in 0003: pin created_by so the open update policy
-- can't be used to take ownership of a row and then delete it.
create trigger venues_freeze_created_by
  before update on public.venues
  for each row execute function public.freeze_created_by();

create trigger maintenance_entries_freeze_created_by
  before update on public.maintenance_entries
  for each row execute function public.freeze_created_by();
