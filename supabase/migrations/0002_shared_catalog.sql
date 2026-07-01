-- Blackburst — shared hardware catalog.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
--
-- Model: a global, org-wide library of user-added equipment layered on top of
-- the built-in seed catalogs in the client. Not tied to any project — every
-- authenticated user reads the whole library and can contribute to it. `kind`
-- namespaces the four libraries (rack | system | panel | inv); `data` is the
-- library-specific device record (e.g. a RackItemDef) as JSONB.

create table public.catalog_items (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('rack', 'system', 'panel', 'inv')),
  data       jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index catalog_items_kind_idx on public.catalog_items (kind);

alter table public.catalog_items enable row level security;

-- The catalog is a shared internal library: any signed-in user may read it and
-- add to it. Deletion is limited to the contributor who created the entry.
create policy "catalog readable by authenticated"
  on public.catalog_items for select
  to authenticated
  using (true);

create policy "catalog insert by authenticated"
  on public.catalog_items for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "catalog delete own"
  on public.catalog_items for delete
  to authenticated
  using (created_by = auth.uid());
