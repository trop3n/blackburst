-- Blackburst — ownership hardening: orphaned rows and the last owner.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- Requires 0001 (project_members) and 0002–0004 (the global tables).
--
-- Two gaps from the same review:
--
-- 1. The global tables' "delete own" policies test created_by = auth.uid(),
--    which is never true once the contributor's account is deleted — the FK
--    sets created_by null, fossilizing the row for everyone but the service
--    role. Offboarding a teammate should not make their contributions
--    undeletable, so orphaned rows may be deleted by any signed-in user.
--
-- 2. Nothing stopped a project's last owner leaving it or being demoted
--    (members_delete lets any member remove their own row). A project with no
--    owner is permanently unmanageable — nobody can share it, delete it, or
--    change roles, and only the dashboard can recover it. The UI already
--    refuses; this enforces it where the UI can't be bypassed.

-- ─────────────── 1 · orphaned rows deletable by anyone ───────────────

drop policy "catalog delete own" on public.catalog_items;
create policy "catalog delete own or orphaned"
  on public.catalog_items for delete
  to authenticated
  using (created_by = auth.uid() or created_by is null);

drop policy "devices delete own" on public.devices;
create policy "devices delete own or orphaned"
  on public.devices for delete
  to authenticated
  using (created_by = auth.uid() or created_by is null);

drop policy "venues delete own" on public.venues;
create policy "venues delete own or orphaned"
  on public.venues for delete
  to authenticated
  using (created_by = auth.uid() or created_by is null);

drop policy "maintenance delete own" on public.maintenance_entries;
create policy "maintenance delete own or orphaned"
  on public.maintenance_entries for delete
  to authenticated
  using (created_by = auth.uid() or created_by is null);

-- ─────────────── 2 · a project never loses its last owner ───────────────
-- SECURITY DEFINER: the roster check must see every member regardless of the
-- caller's RLS view, and cascades need auth.users consulted.
--
-- The two parent-exists checks let cascades through: when the project itself is
-- deleted (owner action) or the member's auth user is deleted (offboarding via
-- the dashboard), the parent row is already gone by the time this fires, and
-- blocking would abort the whole cascade.

create function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'owner'
    and (tg_op = 'DELETE' or new.role <> 'owner')
    and exists (select 1 from public.projects p where p.id = old.project_id)
    and exists (select 1 from auth.users u where u.id = old.user_id)
    and not exists (
      select 1
      from public.project_members m
      where m.project_id = old.project_id
        and m.user_id <> old.user_id
        and m.role = 'owner'
    )
  then
    raise exception 'cannot remove or demote the last owner of a project';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger project_members_protect_last_owner
  before delete or update on public.project_members
  for each row execute function public.protect_last_owner();
