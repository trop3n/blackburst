import { useEffect, useRef, useState } from "react";
import { useDialog } from "@/store/useDialog";

// Renders the active dialog request (see useDialog). Enter confirms, Escape /
// backdrop-click cancels; keydowns are trapped so module shortcuts don't fire
// underneath. Kept always-mounted in App so it works during bootstrap too.
export function DialogHost() {
  const current = useDialog((s) => s.current);
  const resolveCurrent = useDialog((s) => s.resolveCurrent);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  const isPrompt = current?.kind === "prompt";
  const dialogId = current?.id;

  useEffect(() => {
    if (!current) return;
    if (current.kind === "prompt") {
      setValue(current.defaultValue ?? "");
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => okRef.current?.focus(), 0);
    return () => clearTimeout(t);
    // Re-run per distinct dialog so a queued dialog re-focuses.
  }, [dialogId, current]);

  if (!current) return null;

  const confirm = () => resolveCurrent(isPrompt ? value : true);
  const cancel = () =>
    resolveCurrent(current.kind === "prompt" ? null : current.kind === "confirm" ? false : true);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Trap keys so module-level window shortcuts don't run behind the dialog.
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      confirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div className="dialog-overlay" onMouseDown={cancel}>
      <div className="dialog-panel" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="dialog-message">{current.message}</div>
        {isPrompt && (
          <input
            ref={inputRef}
            className="dialog-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <div className="dialog-actions">
          {current.kind !== "alert" && (
            <button className="tb-btn" onClick={cancel}>
              {current.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            ref={okRef}
            className={`tb-btn ${current.danger ? "danger" : "primary"}`}
            onClick={confirm}
          >
            {current.confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
