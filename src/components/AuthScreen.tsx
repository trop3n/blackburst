import { useState } from "react";
import { useAuth } from "@/store/useAuth";

// Password is the primary path: accounts are created in the Supabase dashboard
// for a known team, so no email is sent and the built-in sender's rate limit
// never applies. The link/code flow stays available for whenever custom SMTP is
// configured — it is not dead, just impractical on the default email service.
type Mode = "password" | "link";

export function AuthScreen() {
  const sentTo = useAuth((s) => s.sentTo);
  const signInWithPassword = useAuth((s) => s.signInWithPassword);
  const signInWithMagicLink = useAuth((s) => s.signInWithMagicLink);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const resetSent = useAuth((s) => s.resetSent);
  const callbackError = useAuth((s) => s.callbackError);
  const clearCallbackError = useAuth((s) => s.clearCallbackError);

  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setErr(null);
    clearCallbackError();
    const error = await fn();
    setBusy(false);
    if (error) setErr(error);
  }

  function switchMode(next: Mode) {
    setErr(null);
    setCode("");
    setPassword("");
    clearCallbackError();
    if (sentTo) resetSent();
    setMode(next);
  }

  const problem = err ?? (callbackError ? `Sign-in link failed: ${callbackError}` : null);

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">BLACKBURST</span>
          <span className="auth-tag">AV / live-production design</span>
        </div>

        {mode === "password" ? (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              const addr = email.trim();
              if (!addr || !password) return;
              void run(() => signInWithPassword(addr, password));
            }}
          >
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              className="auth-input"
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              className="auth-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {problem && <p className="auth-err">{problem}</p>}
            <button className="tb-btn primary auth-submit" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button
              className="tb-btn auth-submit"
              type="button"
              onClick={() => switchMode("link")}
            >
              Email me a sign-in link instead
            </button>
          </form>
        ) : sentTo ? (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              const token = code.trim();
              if (!token) return;
              void run(() => verifyOtp(sentTo, token));
            }}
          >
            <p className="auth-hint">
              Check your inbox — we emailed a sign-in link to <strong>{sentTo}</strong>. Open
              it on this device, or enter the code below if your email template includes one.
            </p>
            <label className="auth-label" htmlFor="auth-code">
              Code
            </label>
            <input
              id="auth-code"
              className="auth-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {problem && <p className="auth-err">{problem}</p>}
            <button className="tb-btn primary auth-submit" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify code"}
            </button>
            <button
              className="tb-btn auth-submit"
              type="button"
              onClick={() => switchMode("password")}
            >
              Use a password instead
            </button>
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              const addr = email.trim();
              if (!addr) return;
              void run(() => signInWithMagicLink(addr));
            }}
          >
            <label className="auth-label" htmlFor="auth-link-email">
              Email
            </label>
            <input
              id="auth-link-email"
              className="auth-input"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {problem && <p className="auth-err">{problem}</p>}
            <button className="tb-btn primary auth-submit" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send magic link"}
            </button>
            <button
              className="tb-btn auth-submit"
              type="button"
              onClick={() => switchMode("password")}
            >
              Use a password instead
            </button>
            <p className="auth-hint">
              Needs custom SMTP — the built-in email service is rate limited to a few
              messages per hour.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
