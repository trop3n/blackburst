import { useState } from "react";
import { I } from "@/components/Icon";
import { RefChip } from "@/components/RefChip";
import type { RefKind } from "@/lib/nav";
import { useInventory } from "@/modules/inventory/store";
import { useRack } from "@/modules/rack-builder/store";
import { useSystem } from "@/modules/system-designer/store";
import { promptDialog } from "@/store/useDialog";
import { newDeviceId, useDevices } from "@/store/useDevices";

interface Usage {
  kind: RefKind;
  id: string;
  label: string;
}

interface DeviceLinkProps {
  deviceId: string | undefined;
  onChange: (deviceId: string | undefined) => void;
  // Seeds a newly-created device so linking from a rack slot or graph node
  // doesn't make the user retype what the app already knows.
  defaultLabel: string;
  model: string;
  // The place this section is rendered, so it doesn't link back to itself.
  omit?: { kind: RefKind; id: string };
}

export function DeviceLink({ deviceId, onChange, defaultLabel, model, omit }: DeviceLinkProps) {
  const devices = useDevices((s) => s.devices);
  const addDevice = useDevices((s) => s.addDevice);
  const updateDevice = useDevices((s) => s.updateDevice);
  const racks = useRack((s) => s.racks);
  const nodes = useSystem((s) => s.nodes);
  const assets = useInventory((s) => s.assets);
  const [picking, setPicking] = useState(false);

  const device = deviceId ? devices.find((d) => d.id === deviceId) : undefined;

  const usages: Usage[] = [];
  if (device) {
    for (const r of racks)
      for (const it of r.items)
        if (it.deviceId === device.id)
          usages.push({ kind: "rack-item", id: `${r.id}:${it.iid}`, label: `${r.name} · U${it.pos}` });
    for (const n of nodes)
      if (n.deviceId === device.id) usages.push({ kind: "node", id: n.id, label: n.name });
    for (const a of assets)
      if (a.deviceId === device.id) usages.push({ kind: "asset", id: a.id, label: `${a.id} · ${a.model}` });
  }
  const otherUsages = omit
    ? usages.filter((u) => !(u.kind === omit.kind && u.id === omit.id))
    : usages;

  const createDevice = async () => {
    const label = (await promptDialog("Device name?", defaultLabel))?.trim();
    if (!label) return;
    const serial = (await promptDialog("Serial number? (optional)", ""))?.trim() ?? "";
    const id = newDeviceId();
    addDevice({ id, model, label, serial });
    onChange(id);
    setPicking(false);
  };

  const editSerial = async () => {
    if (!device) return;
    const serial = (await promptDialog("Serial number?", device.serial))?.trim();
    if (serial == null) return;
    updateDevice(device.id, { serial });
  };

  return (
    <>
      <div className="section-h">
        <span>LINKED DEVICE</span>
        <span className="line" />
      </div>

      {device ? (
        <>
          <div className="kv">
            <span className="k">Device</span>
            <span className="v">{device.label}</span>
            <span className="k">Serial</span>
            <span className="v">{device.serial || "—"}</span>
          </div>
          {otherUsages.length > 0 && (
            <>
              <div className="section-h">
                <span>ALSO APPEARS IN</span>
                <span className="line" />
              </div>
              {otherUsages.map((u) => (
                <div className="list-row" key={`${u.kind}-${u.id}`}>
                  <RefChip kind={u.kind} id={u.id}>
                    {u.label}
                  </RefChip>
                </div>
              ))}
            </>
          )}
          <div style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
            <button className="tb-btn" style={{ flex: 1, justifyContent: "center" }} onClick={editSerial}>
              <I.Edit size={12} /> Serial
            </button>
            <button
              className="tb-btn"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => onChange(undefined)}
            >
              <I.Cross size={12} /> Unlink
            </button>
          </div>
        </>
      ) : picking ? (
        <>
          <div style={{ maxHeight: 180, overflow: "auto" }}>
            {devices.length === 0 && (
              <div
                className="mono"
                style={{ padding: "8px 12px", fontSize: 10, color: "var(--color-fg-faint)" }}
              >
                No devices in this project yet.
              </div>
            )}
            {devices.map((d) => (
              <div
                key={d.id}
                className="list-row"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  onChange(d.id);
                  setPicking(false);
                }}
              >
                <I.Inventory size={12} />
                <span className="lbl">{d.label}</span>
                {d.serial && <span className="meta">{d.serial}</span>}
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 12px", display: "flex", gap: 6 }}>
            <button className="tb-btn primary" style={{ flex: 1, justifyContent: "center" }} onClick={createDevice}>
              <I.Plus size={12} /> New device
            </button>
            <button className="tb-btn" onClick={() => setPicking(false)}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: "8px 12px" }}>
          <button
            className="tb-btn"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setPicking(true)}
          >
            <I.Plus size={12} /> Link device
          </button>
        </div>
      )}
    </>
  );
}
