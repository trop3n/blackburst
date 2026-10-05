import { create } from "zustand";
import type { NetDevice } from "@/types";

// Served same-origin by this container's nginx, which proxies the one file from
// the Network app and attaches the Access service token (see
// nginx-network-proxy.conf.example). Same-origin on purpose: it keeps the token
// server-side, and it means the CSP's connect-src needs no new entry.
const EXPORT_URL = "/api/network/export.json";

// Twelve hex digits, any separator or none. Compared normalised so a MAC typed
// with dashes or in lower case still matches the export's `AA:BB:CC:DD:EE:FF`.
export const normalizeMac = (mac: string) => mac.replace(/[^0-9a-fA-F]/g, "").toUpperCase();

export const canonicalMac = (mac: string) => normalizeMac(mac).match(/.{2}/g)?.join(":") ?? "";

export const isMac = (mac: string) => normalizeMac(mac).length === 12;

// `off` is a first-class answer, not a failure: a deployment without the proxy
// snippet mounted has no Network app to read, exactly as an unset
// VITE_SUPABASE_URL means local mode rather than a broken app. The UI renders
// nothing in that state rather than an empty panel or a zero.
type Status = "idle" | "loading" | "ready" | "off" | "error";

interface NetworkState {
  status: Status;
  generated: string;
  devices: NetDevice[];
  byMac: Record<string, NetDevice>;
  hydrate: () => Promise<void>;
}

export const useNetwork = create<NetworkState>()((set, get) => ({
  status: "idle",
  generated: "",
  devices: [],
  byMac: {},

  hydrate: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    let res: Response;
    try {
      res = await fetch(EXPORT_URL, { headers: { accept: "application/json" } });
    } catch {
      set({ status: "error" });
      return;
    }
    // nginx answers 404 when the snippet is absent, which is the configured-off
    // case rather than a fault. A 403 is different and stays an error: it means
    // the proxy is there and Access rejected the service token.
    if (res.status === 404) {
      set({ status: "off" });
      return;
    }
    if (!res.ok) {
      set({ status: "error" });
      return;
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      // A 200 that is not JSON is an SPA fallback catching the path, so there is
      // no endpoint here either.
      set({ status: "off" });
      return;
    }
    const payload = body as { generated?: unknown; devices?: unknown };
    if (!Array.isArray(payload?.devices)) {
      set({ status: "off" });
      return;
    }
    const devices = payload.devices as NetDevice[];
    const byMac: Record<string, NetDevice> = {};
    for (const d of devices) {
      if (d?.mac && isMac(d.mac)) byMac[normalizeMac(d.mac)] = d;
    }
    set({
      status: "ready",
      generated: typeof payload.generated === "string" ? payload.generated : "",
      devices,
      byMac,
    });
  },
}));
