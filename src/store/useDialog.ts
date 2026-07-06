import { create } from "zustand";

// In-app replacements for window.prompt / confirm / alert, styled like the rest
// of the shell. The API is promise-based (native dialogs block synchronously;
// these resolve when the user responds), so call sites become async. A single
// <DialogHost/> renders the active request; concurrent requests queue.

type DialogKind = "alert" | "confirm" | "prompt";
type DialogResult = string | boolean | null;

export interface PendingDialog {
  id: number;
  kind: DialogKind;
  message: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (value: DialogResult) => void;
}

interface DialogState {
  current: PendingDialog | null;
  queue: PendingDialog[];
  resolveCurrent: (value: DialogResult) => void;
}

export const useDialog = create<DialogState>((set, get) => ({
  current: null,
  queue: [],
  resolveCurrent: (value) => {
    const cur = get().current;
    if (cur) cur.resolve(value);
    const [next, ...rest] = get().queue;
    set({ current: next ?? null, queue: rest });
  },
}));

let seq = 0;

function enqueue(req: Omit<PendingDialog, "id" | "resolve">): Promise<DialogResult> {
  return new Promise((resolve) => {
    const item: PendingDialog = { ...req, id: ++seq, resolve };
    if (useDialog.getState().current) {
      useDialog.setState((s) => ({ queue: [...s.queue, item] }));
    } else {
      useDialog.setState({ current: item });
    }
  });
}

export interface DialogOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function alertDialog(message: string, opts: DialogOptions = {}): Promise<void> {
  return enqueue({ kind: "alert", message, ...opts }).then(() => undefined);
}

export function confirmDialog(message: string, opts: DialogOptions = {}): Promise<boolean> {
  return enqueue({ kind: "confirm", message, ...opts }).then((v) => v === true);
}

// Resolves the entered string, or null when cancelled — mirroring window.prompt.
export function promptDialog(
  message: string,
  defaultValue = "",
  opts: DialogOptions = {},
): Promise<string | null> {
  return enqueue({ kind: "prompt", message, defaultValue, ...opts }).then((v) =>
    typeof v === "string" ? v : null,
  );
}
