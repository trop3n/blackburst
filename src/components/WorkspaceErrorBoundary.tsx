import { Component, type ReactNode } from "react";
import { I } from "@/components/Icon";
import { exportProject } from "@/lib/project-io";
import { upsertBucket } from "@/lib/project-remote";
import { applyState, scaffoldBucket, writeBucket } from "@/lib/project-storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/store/useApp";
import { confirmDialog } from "@/store/useDialog";

interface Props {
  children: ReactNode;
}

interface State {
  error: string | null;
}

// Corrupt project data — a hand-edited import, a bad server row — crashes the
// first render that maps over it, and because the bucket was persisted before
// rendering, every reload crashed the same way: a bricked project with no way
// out short of editing storage by hand. This wraps the whole signed-in shell,
// not just the module slot: CommandPalette and StatusBar derive rows from the
// same stores, so a crash can start outside the module. App.tsx keys it by
// project, so switching projects retries with fresh state.
export class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(err: unknown): State {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  retry = () => this.setState({ error: null });

  reset = async () => {
    const ok = await confirmDialog(
      "Reset this project to a blank scaffold? Its current data cannot be rendered — use Export first if you want the raw JSON.",
      { danger: true, confirmLabel: "Reset project" },
    );
    if (!ok) return;
    const bucket = scaffoldBucket();
    applyState(bucket);
    // applyState suppresses autosave while loading, so persist explicitly —
    // otherwise the corrupt bucket survives in storage and the next reload
    // crashes again.
    const id = useApp.getState().currentProjectId;
    if (isSupabaseConfigured) void upsertBucket(id, bucket).catch(() => {});
    else writeBucket(id, bucket);
    this.setState({ error: null });
  };

  render() {
    if (this.state.error == null) return this.props.children;
    return (
      <div className="empty" style={{ minHeight: "100vh" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <I.Bolt size={20} />
          </div>
          <div className="t">WORKSPACE FAILED TO RENDER</div>
          <p style={{ maxWidth: 420 }}>
            This project&apos;s data crashed the view — usually a malformed import or a
            corrupted record. {this.state.error}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
            <button className="tb-btn" onClick={this.retry}>
              Try again
            </button>
            <button className="tb-btn" onClick={exportProject}>
              <I.Export size={13} /> Export raw
            </button>
            <button className="tb-btn danger" onClick={() => void this.reset()}>
              Reset project…
            </button>
          </div>
        </div>
      </div>
    );
  }
}
