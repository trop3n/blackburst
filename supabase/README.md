# Supabase setup (auth & sharing)

Blackburst runs in **local-only mode** until these two env vars are set; then it
enforces magic-link sign-in and stores every project on the server, shared by
membership. Follow these once.

## 1. Create a project
Create a free project at [supabase.com](https://supabase.com). Note the **Project
URL** and **anon / publishable key** under **Project Settings → API**.

## 2. Run the schema
Open **SQL Editor** and run **every** migration in `migrations/`, in numerical
order. (Or, with the Supabase CLI: `supabase db push`.)

| migration | adds |
| --- | --- |
| [`0001_auth_sharing.sql`](./migrations/0001_auth_sharing.sql) | projects, membership, invites, `project_state`, revisions, the `private.is_member()` RLS helper, signup/owner triggers, the `claim_invites()` RPC, all policies, and `project_state` on the realtime publication |
| [`0002_shared_catalog.sql`](./migrations/0002_shared_catalog.sql) | `catalog_items` — the org-wide user-extendable hardware catalog |
| [`0003_devices.sql`](./migrations/0003_devices.sql) | `devices` — the global device registry (a physical box outlives the project that specified it) |
| [`0004_venues_maintenance.sql`](./migrations/0004_venues_maintenance.sql) | `venues` + `maintenance_entries` — the Maintenance Log; requires 0003 |
| [`0005_realtime_global.sql`](./migrations/0005_realtime_global.sql) | puts the four global tables on the realtime publication and adds `updated_by` so a client can ignore its own echo; requires 0002–0004 |

**Applying only 0001 leaves the app half-working.** Server writes are
fire-and-forget (`.catch(() => {})`) so a missing table fails *silently* — the
catalog, device registry and maintenance log will simply never persist, with no
error surfaced. If server-backed data seems to vanish, check this first.

## 3. Configure auth URLs
**Authentication → URL Configuration**:
- **Site URL** — your production origin (e.g. `https://blackburst.vercel.app`).
- **Redirect URLs** — add `http://localhost:5173` and your Vercel origin so the
  magic link returns to the app.

Email magic-link sign-in is enabled by default. (Optionally customize the email
template under **Authentication → Email Templates**.)

## 4. Set env vars
Copy `.env.example` to `.env.local` in the repo root and fill in:

```
VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-ANON-KEY
```

Restart `npm run dev` (Vite reads env only at startup). For production, add the
same two variables in **Vercel → Project Settings → Environment Variables** and
redeploy.

## 5. First sign-in
Enter your email → open the magic link on the same device. The app bootstraps
your workspace; if this browser had local projects, it offers to import them once.

## Model
- **Projects** are owned by their creator and shared via **`project_members`**
  with roles **owner / editor / viewer**.
- **Invite by email** (Share button): the invite attaches as a membership the
  next time that person signs in (`claim_invites()` runs on every load).
- **owner** manages sharing & deletes; **editor** edits; **viewer** is read-only
  (enforced by RLS, with edit affordances disabled in the UI).
- Each project's full module state is one JSONB row in **`project_state`**;
  autosave upserts it (250 ms debounced), and realtime refreshes collaborators.
- Concurrency is **last-write-wins** per project — fine for v1, not a live CRDT.
