import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The app runs in local-only mode when these are unset, so the client is created
// with harmless placeholders to keep imports total.
export const isSupabaseConfigured = Boolean(url && anonKey);
export const SUPABASE_URL = url ?? "";
export const SUPABASE_ANON_KEY = anonKey ?? "";

export const supabase: SupabaseClient = createClient(
  url || "http://localhost:54321",
  anonKey || "anon-key-not-configured",
);
