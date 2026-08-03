import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AuthStatus = "loading" | "signed-out" | "signed-in";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  configured: boolean;
  sentTo: string | null;
  callbackError: string | null;
  clearCallbackError: () => void;
  init: () => void;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<string | null>;
  verifyOtp: (email: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetSent: () => void;
}

let started = false;

// Implicit flow (the client default) reports a failed email link as URL fragment
// params — #error=access_denied&error_description=… — which supabase-js neither
// surfaces nor logs. Without this the app just re-renders the sign-in form and
// the failure is invisible.
//
// Read at module scope, before the client's async session detection runs, and
// consume the fragment ONLY when it is an error: a successful callback carries
// access_token in that same fragment and must be left intact for supabase-js.
function readCallbackError(): string | null {
  if (typeof window === "undefined") return null;
  for (const raw of [window.location.hash, window.location.search]) {
    if (!raw) continue;
    const p = new URLSearchParams(raw.replace(/^[#?]/, ""));
    if (p.get("access_token")) return null;
    const code = p.get("error") ?? p.get("error_code");
    if (!code) continue;
    window.history.replaceState(null, "", window.location.pathname);
    return p.get("error_description") ?? code;
  }
  return null;
}

export const useAuth = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  session: null,
  configured: isSupabaseConfigured,
  sentTo: null,
  callbackError: readCallbackError(),
  clearCallbackError: () => set({ callbackError: null }),
  init: () => {
    if (started) return;
    started = true;
    if (!isSupabaseConfigured) {
      set({ status: "signed-out" });
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      set({
        session,
        user: session?.user ?? null,
        status: session ? "signed-in" : "signed-out",
      });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set((s) => ({
        session,
        user: session?.user ?? null,
        status: session ? "signed-in" : "signed-out",
        sentTo: session ? null : s.sentTo,
      }));
    });
  },
  // Primary path for this deployment: a small known team, with accounts created
  // in the Supabase dashboard. Sends no email, so it is unaffected by the email
  // rate limit that makes magic links impractical without custom SMTP.
  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  },
  signInWithMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return error.message;
    set({ sentTo: email });
    return null;
  },
  verifyOtp: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) return error.message;
    return null;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ sentTo: null });
  },
  resetSent: () => set({ sentTo: null }),
}));

export function displayNameOf(user: User | null): string {
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const dn = typeof meta.display_name === "string" ? meta.display_name.trim() : "";
  return dn || user.email || "";
}

export function initialsOf(user: User | null): string {
  const label = displayNameOf(user);
  if (!label) return "?";
  const base = label.split("@")[0];
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]).join("");
  return (letters || label[0]).toUpperCase();
}
