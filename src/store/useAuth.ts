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
  init: () => void;
  signInWithMagicLink: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetSent: () => void;
}

let started = false;

export const useAuth = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  session: null,
  configured: isSupabaseConfigured,
  sentTo: null,
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
  signInWithMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return error.message;
    set({ sentTo: email });
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
