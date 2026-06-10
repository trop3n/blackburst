# Supabase setup (auth & sharing)

Blackburst runs in **local-only mode** until these two env vars are set; then it
enforces magic-link sign-in and stores every project on the server, shared by
membership. Follow these once.

## 1. Create a project
Create a free project at [supabase.com](https://supabase.com). Note the **Project
URL** and **anon / publishable key** under **Project Settings → API**.

## 2. Run the schema
Open **SQL Editor**, paste the contents of
[`migrations/0001_auth_sharing.sql`](./migrations/0001_auth_sharing.sql), and run
it. (Or, with the Supabase CLI: `supabase db push`.) This creates the tables,
the `private.is_member()` RLS helper, the signup/owner triggers, the
`claim_invites()` RPC, all row-level-security policies, and adds `project_state`
to the realtime publication.

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
