# Supabase setup (auth & sharing)

Blackburst runs in **local-only mode** until these two env vars are set; then it
gates behind sign-in and stores every project on the server, shared by
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
| [`0006_project_state_stamp.sql`](./migrations/0006_project_state_stamp.sql) | stamps `project_state.updated_by` / `updated_at` server-side, so the echo check can't be defeated by a forged client value; **must be applied before deploying a client built after it** |
| [`0007_ownership_hardening.sql`](./migrations/0007_ownership_hardening.sql) | orphaned global rows (`created_by null` after their contributor's account is deleted) become deletable by anyone, and a trigger stops a project's last owner being removed or demoted (cascades from project/user deletion pass through) |

**Applying only 0001 leaves the app half-working.** Server writes are
fire-and-forget (`.catch(() => {})`) so a missing table fails *silently* — the
catalog, device registry and maintenance log will simply never persist, with no
error surfaced. If server-backed data seems to vanish, check this first.

## 3. Create the accounts
**Email + password is the primary sign-in path**, and there is no self-signup:
create each user under **Authentication → Users → Add user**, with **Auto
Confirm** on. This sends no email, so it is unaffected by the rate limit below.
Password resets are done from the same screen.

The magic-link / one-time-code path is built and reachable from the sign-in
screen ("Email me a sign-in link instead"), but is **impractical on the default
email service**, which allows only a few messages an hour. To use it, configure
**custom SMTP** under **Project Settings → Auth**, and — for the 6-digit code —
add `{{ .Token }}` to the template under **Authentication → Email Templates**;
the stock template omits it, so no code is actually delivered.

If you enable that path, also set **Authentication → URL Configuration**:
- **Site URL** — your production origin (e.g. `https://blackburst.vercel.app`).
- **Redirect URLs** — add `http://localhost:5173` and your Vercel origin so the
  link returns to the app.

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
Enter the email and password of an account created in step 3. The app bootstraps
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
  The global tables — `catalog_items`, `devices`, `venues`, `maintenance_entries`
  — sync the same way once 0005 is applied.
- Concurrency is **last-write-wins** per project — fine for v1, not a live CRDT.
- **Realtime ignores rows whose `updated_by` is the current user**, so a session
  never reacts to its own echo. Consequence when testing: **one account open in
  two windows will not sync**, and looks completely broken. Verify with two
  different accounts in separate browser profiles. Expect roughly a second end to
  end (400 ms write debounce + 300 ms refresh debounce + network).
