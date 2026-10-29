import { findPort, portLane } from "@/lib/ports";
import type { Lane, SystemEdge, SystemNode } from "@/types";

export type IssueLevel = "warn" | "error";
export type SystemIssueCategory = "wiring" | "ports" | "signal";

export interface SystemIssue {
  id: string;
  level: IssueLevel;
  category: SystemIssueCategory;
  title: string;
  detail: string;
}

export interface SystemIssueSummary {
  errors: number;
  warnings: number;
  level: "ok" | "warn" | "error";
}

export function summarizeSystemIssues(issues: SystemIssue[]): SystemIssueSummary {
  let errors = 0;
  let warnings = 0;
  for (const i of issues) {
    if (i.level === "error") errors++;
    else warnings++;
  }
  const level = errors > 0 ? "error" : warnings > 0 ? "warn" : "ok";
  return { errors, warnings, level };
}

// Lanes whose sockets take one cable each. A `bidi` socket — etherCON, Dante —
// is a shared medium carrying many streams down one cable, so neither occupancy
// nor exhaustion says anything about it.
const POINT_TO_POINT: Lane[] = ["video", "audio"];

const LANE_WORD: Record<Lane, string> = {
  video: "video",
  audio: "audio",
  network: "network",
  power: "power",
};

// Every rule needs both ends of a cable resolved against the device that owns
// them, so findings are only produced for nodes that carry a sourced port list.
// A device with no ports is not "clean" — it is unknown, and saying nothing is
// the honest answer.
export function validateSystem(nodes: SystemNode[], edges: SystemEdge[]): SystemIssue[] {
  const issues: SystemIssue[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nameOf = (id: string) => byId.get(id)?.name ?? id;

  // nodeId|portId → the cables claiming it
  const claims = new Map<string, number>();

  for (const e of edges) {
    if (e.from === e.to) {
      issues.push({
        id: `self-loop:${e.id}`,
        level: "error",
        category: "wiring",
        title: "Cable loops back to its own device",
        detail: `${nameOf(e.from)} is wired to itself on the ${LANE_WORD[e.lane]} lane.`,
      });
    }

    for (const end of ["src", "dest"] as const) {
      const nodeId = end === "src" ? e.from : e.to;
      const node = byId.get(nodeId);
      if (!node?.ports?.length) continue;
      const side = end === "src" ? "source" : "destination";
      const portId = end === "src" ? e.srcPortId : e.destPortId;

      if (!portId) {
        issues.push({
          id: `port-unassigned:${e.id}:${end}`,
          level: "warn",
          category: "ports",
          title: "Cable end names no socket",
          detail: `The ${side} end at ${node.name} has no socket chosen, so the patch sheet cannot say where it lands.`,
        });
        continue;
      }

      const port = findPort(node, portId);
      if (!port) {
        issues.push({
          id: `port-missing:${e.id}:${end}`,
          level: "error",
          category: "ports",
          title: "Socket no longer exists",
          detail: `The ${side} end names a socket ${node.name} does not have. Pick one from its panel.`,
        });
        continue;
      }

      if (portLane(port.signal) !== e.lane) {
        issues.push({
          id: `lane-mismatch:${e.id}:${end}`,
          level: "error",
          category: "signal",
          title: "Socket is on the wrong lane",
          detail: `${node.name} · ${port.label} carries ${LANE_WORD[portLane(port.signal)]}, but this cable is on the ${LANE_WORD[e.lane]} lane.`,
        });
      }

      if (port.dir !== "bidi") {
        const key = `${node.id}|${port.id}`;
        claims.set(key, (claims.get(key) ?? 0) + 1);
      }
    }
  }

  for (const [key, count] of claims) {
    if (count < 2) continue;
    const [nodeId, portId] = key.split("|");
    const node = byId.get(nodeId);
    issues.push({
      id: `port-occupied:${key}`,
      level: "error",
      category: "ports",
      title: "Two cables on one socket",
      detail: `${count} cables land on ${nameOf(nodeId)} · ${findPort(node, portId)?.label ?? portId}. Free one, or go through a splitter.`,
    });
  }

  for (const n of nodes) {
    if (!n.ports?.length) continue;
    for (const lane of POINT_TO_POINT) {
      for (const dir of ["in", "out"] as const) {
        // `bidi` is excluded by the equality: a shared socket is not one of the
        // dedicated sockets this count is about.
        const sockets = n.ports.filter((p) => p.dir === dir && portLane(p.signal) === lane).length;
        if (sockets === 0) continue;
        const cables = edges.filter(
          (e) => e.lane === lane && (dir === "out" ? e.from === n.id : e.to === n.id),
        ).length;
        if (cables <= sockets) continue;
        issues.push({
          id: `ports-exhausted:${n.id}:${lane}:${dir}`,
          level: "error",
          category: "ports",
          title: "More cables than sockets",
          detail: `${cables} ${LANE_WORD[lane]} cables ${dir === "out" ? "leave" : "reach"} ${n.name}, which has ${sockets}. ${cables - sockets} cannot be patched.`,
        });
      }
    }
  }

  return issues;
}
