-- Blackburst — server-side stamping for project_state.
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- Requires 0001 (project_state); extends the 0005 principle to the table that
-- originally carried the column.
--
-- 0005 stamps updated_by server-side on the four global tables because the
-- client has no reason to be trusted with it — but project_state still took
-- updated_by and updated_at from the request body. Every subscription discards
-- rows whose updated_by matches the current user, so a forged updated_by is
-- worse than wrong attribution: an editor could write updated_by = <victim id>
-- and that collaborator's client would discard the change as its own echo while
-- everyone else applied it — a targeted, persistent desync.
--
-- ⚠ Order matters: run this BEFORE deploying the client that stops sending the
-- two columns. Against an un-migrated database that client leaves updated_by
-- holding the *previous* writer's id on every update — which is exactly the
-- desync described above, no forgery required.
--
-- Not reusing 0005's stamp_updated_by(): project_state also carries updated_at,
-- whose column default only applies on insert, so updates need it stamped too.

create function public.stamp_project_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create trigger project_state_stamp
  before insert or update on public.project_state
  for each row execute function public.stamp_project_state();
