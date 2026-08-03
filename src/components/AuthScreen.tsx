import { useState } from "react";
import { useAuth } from "@/store/useAuth";

export function AuthScreen() {
  const sentTo = useAuth((s) => s.sentTo);
  const signIn = useAuth((s) => s.signInWithMagicLink);
  const verifyOtp = useAuth((s) => s.verifyOtp);
  const resetSent = useAuth((s) => s.resetSent);
  const callbackError = useAuth((s) => s.callbackError);
  const clearCallbackError = useAuth((s) => s.clearCallbackError);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setBusy(true);
    setErr(null);
    clearCallbackError();
    const error = await signIn(addr);
    setBusy(false);
    if (error) setErr(error);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const token = code.trim();
    if (!token || !sentTo) return;
    setBusy(true);
    setErr(null);
    const error = await verifyOtp(sentTo, token);
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

        {callbackError && (
          <p className="auth-err">Sign-in link failed: {callbackError}</p>
        )}

        {sentTo ? (
          <form className="auth-form" onSubmit={submitCode}>
            <p className="auth-hint">
              Check your inbox — we emailed a sign-in link and a 6-digit code to{" "}
              <strong>{sentTo}</strong>. Open the link on this device, or enter the
              code below.
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
            {err && <p className="auth-err">{err}</p>}
            <button className="tb-btn primary auth-submit" type="submit" disabled={busy}>
              {busy ? "Verifying…" : "Verify code"}
            </button>
            <button
              className="tb-btn auth-submit"
              type="button"
              onClick={() => {
                setErr(null);
                setCode("");
                resetSent();
              }}
            >
              Use a different email
            </button>
          </form>
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
