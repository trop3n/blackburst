import { useState } from "react";
import { useAuth } from "@/store/useAuth";

export function AuthScreen() {
  const sentTo = useAuth((s) => s.sentTo);
  const signIn = useAuth((s) => s.signInWithMagicLink);
  const resetSent = useAuth((s) => s.resetSent);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setBusy(true);
    setErr(null);
    const error = await signIn(addr);
    setBusy(false);
    if (error) setErr(error);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">BLACKBURST</span>
          <span className="auth-tag">AV / live-production design</span>
        </div>

        {sentTo ? (
          <div className="auth-note">
            <p>Check your inbox.</p>
            <p className="auth-hint">
              We sent a magic sign-in link to <strong>{sentTo}</strong>. Open it on
              this device to continue.
            </p>
            <button className="tb-btn" type="button" onClick={resetSent}>
              Use a different email
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {err && <p className="auth-err">{err}</p>}
            <button className="tb-btn primary auth-submit" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send magic link"}
            </button>
            <p className="auth-hint">No password — we’ll email you a sign-in link.</p>
          </form>
        )}
      </div>
    </div>
  );
}
