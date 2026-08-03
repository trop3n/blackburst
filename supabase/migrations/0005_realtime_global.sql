-- Blackburst — realtime for the project-independent layers.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- Requires 0002, 0003 and 0004.
--
-- 0001 put only project_state on the realtime publication, so the shared
-- catalog, the device registry, venues and the maintenance log needed a reload
-- to show a colleague's changes. This adds them.
--
-- Each table gains `updated_by`, mirroring project_state: the client ignores a
-- change it made itself, and without a last-editor column it can't tell. It
-- cannot reuse `created_by` for this — 0003 deliberately freezes that column to
-- the original contributor, so a row created by A and edited by B still reads
-- created_by = A, and A would wrongly discard B's edit as its own echo.

alter table public.catalog_items       add column updated_by uuid references auth.users (id) on delete set null;
alter table public.devices             add column updated_by uuid references auth.users (id) on delete set null;
alter table public.venues              add column updated_by uuid references auth.users (id) on delete set null;
alter table public.maintenance_entries add column updated_by uuid references auth.users (id) on delete set null;

-- Stamped server-side rather than passed by the client: the client has no reason
-- to be trusted with it, and this way no write path can forget to set it.
create function public.stamp_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger catalog_items_stamp_updated_by
  before insert or update on public.catalog_items
  for each row execute function public.stamp_updated_by();

create trigger devices_stamp_updated_by
  before insert or update on public.devices
  for each row execute function public.stamp_updated_by();

create trigger venues_stamp_updated_by
  before insert or update on public.venues
  for each row execute function public.stamp_updated_by();

create trigger maintenance_entries_stamp_updated_by
  before insert or update on public.maintenance_entries
  for each row execute function public.stamp_updated_by();

-- RLS still applies to realtime: a client only receives rows it could SELECT.
alter publication supabase_realtime add table public.catalog_items;
alter publication supabase_realtime add table public.devices;
alter publication supabase_realtime add table public.venues;
alter publication supabase_realtime add table public.maintenance_entries;
