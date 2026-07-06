import { useEffect, useState } from "react";
import { I } from "@/components/Icon";
import { useApp } from "@/store/useApp";
import { useAuth } from "@/store/useAuth";
import { confirmDialog } from "@/store/useDialog";
import { useShare } from "@/store/useShare";
import type { MemberRole } from "@/types";

const ROLES: MemberRole[] = ["viewer", "editor", "owner"];

function memberLabel(displayName: string | null, email: string | null, userId: string): string {
  return displayName || email || `${userId.slice(0, 8)}…`;
}

export function SharePanel() {
  const open = useShare((s) => s.open);
  const close = useShare((s) => s.close);
  const members = useShare((s) => s.members);
  const invites = useShare((s) => s.invites);
  const loading = useShare((s) => s.loading);
  const error = useShare((s) => s.error);
  const doInvite = useShare((s) => s.invite);
  const setRole = useShare((s) => s.setRole);
  const remove = useShare((s) => s.remove);
  const revoke = useShare((s) => s.revoke);

  const project = useApp((s) => s.project);
  const leaveProject = useApp((s) => s.leaveCurrentProject);
  const myId = useAuth((s) => s.user?.id);

  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;
  const isOwner = project.role === "owner";

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    await doInvite(addr, inviteRole);
    setEmail("");
  }

  return (
    <div className="set-overlay" onMouseDown={close}>
      <div className="set-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="set-hd">
          <span className="set-hd-title">Share — {project.name}</span>
          <button className="set-close" type="button" onClick={close} aria-label="Close share">
            <I.Cross size={12} />
          </button>
        </div>

        <div className="set-body">
          {error && <p className="share-error">{error}</p>}

          <div className="share-group-h">People with access</div>
          {loading && members.length === 0 ? (
            <p className="share-empty">Loading…</p>
          ) : (
            members.map((m) => {
              const isSelf = m.userId === myId;
              return (
                <div className="share-row" key={m.userId}>
                  <div className="share-id">
                    <span className="share-name">
                      {memberLabel(m.displayName, m.email, m.userId)}
                      {isSelf && <span className="share-you"> (you)</span>}
                    </span>
                    {m.email && m.displayName && <span className="share-email">{m.email}</span>}
                  </div>
                  {isOwner && !isSelf ? (
                    <select
                      className="share-role"
                      value={m.role}
                      onChange={(e) => void setRole(m.userId, e.target.value as MemberRole)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="chip">{m.role}</span>
                  )}
                  {isOwner && !isSelf && (
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => void remove(m.userId)}
                      title="Remove"
                      aria-label={`Remove ${memberLabel(m.displayName, m.email, m.userId)}`}
                    >
                      <I.Cross size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}

          {isOwner && (
            <>
              <div className="share-group-h">Invite by email</div>
              <form className="share-invite" onSubmit={submitInvite}>
                <input
                  className="share-invite-input"
                  type="email"
                  placeholder="name@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <select
                  className="share-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button className="tb-btn primary" type="submit">
                  Invite
                </button>
              </form>

              {invites.length > 0 && (
                <>
                  <div className="share-group-h">Pending invites</div>
                  {invites.map((inv) => (
                    <div className="share-row" key={inv.id}>
                      <div className="share-id">
                        <span className="share-name">{inv.email}</span>
                        <span className="share-email">invited · {inv.role}</span>
                      </div>
                      <button
                        className="icon-btn"
                        type="button"
                        onClick={() => void revoke(inv.id)}
                        title="Revoke invite"
                        aria-label={`Revoke invite for ${inv.email}`}
                      >
                        <I.Cross size={12} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <div className="set-foot">
          {!isOwner && (
            <button
              className="tb-btn danger"
              type="button"
              onClick={async () => {
                const ok = await confirmDialog(`Leave “${project.name}”? You'll lose access until re-invited.`, {
                  danger: true,
                  confirmLabel: "Leave",
                });
                if (ok) {
                  close();
                  void leaveProject();
                }
              }}
            >
              Leave project
            </button>
          )}
          <span className="set-foot-spacer" />
          <button className="tb-btn" type="button" onClick={close}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
