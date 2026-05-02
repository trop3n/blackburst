import type { Asset, ShowSchedule } from "@/types";

export type IssueLevel = "warn" | "error";
export type IssueCategory = "show-link" | "status-show" | "maint-conflict" | "utilization";

export interface AssetIssue {
  id: string;
  assetId: string;
  level: IssueLevel;
  category: IssueCategory;
  title: string;
  detail: string;
}

export interface AssetIssueSummary {
  errors: number;
  warnings: number;
  level: "ok" | "warn" | "error";
}

export function summarizeAssetIssues(issues: AssetIssue[]): AssetIssueSummary {
  let errors = 0;
  let warnings = 0;
  for (const i of issues) {
    if (i.level === "error") errors++;
    else warnings++;
  }
  const level = errors > 0 ? "error" : warnings > 0 ? "warn" : "ok";
  return { errors, warnings, level };
}

const UNASSIGNED = "—";

function showExists(name: string, shows: ShowSchedule[]): boolean {
  return shows.some((s) => s.name === name);
}

function findFuzzyShow(name: string, shows: ShowSchedule[]): ShowSchedule | undefined {
  return shows.find(
    (s) => s.name.startsWith(`${name} `) || name.startsWith(`${s.name} `),
  );
}

export function validateAssets(assets: Asset[], shows: ShowSchedule[]): AssetIssue[] {
  const issues: AssetIssue[] = [];

  for (const a of assets) {
    if (a.show !== UNASSIGNED && !showExists(a.show, shows)) {
      const fuzzy = findFuzzyShow(a.show, shows);
      issues.push({
        id: `unknown-show-${a.id}`,
        assetId: a.id,
        level: "error",
        category: "show-link",
        title: `${a.id} → unknown show`,
        detail: fuzzy
          ? `"${a.show}" not on schedule. Closest match: "${fuzzy.name}".`
          : `"${a.show}" is not on the show schedule.`,
      });
    }

    if (a.status === "out" && a.show === UNASSIGNED) {
      issues.push({
        id: `out-no-show-${a.id}`,
        assetId: a.id,
        level: "warn",
        category: "status-show",
        title: `${a.id} deployed without a show`,
        detail: "Status is OUT but no show assigned.",
      });
    }

    if (a.status === "in" && a.show !== UNASSIGNED) {
      issues.push({
        id: `in-with-show-${a.id}`,
        assetId: a.id,
        level: "warn",
        category: "status-show",
        title: `${a.id} idle but still assigned`,
        detail: `Status is IN but show "${a.show}" is still attached.`,
      });
    }

    if (a.status === "maint" && a.show !== UNASSIGNED) {
      issues.push({
        id: `maint-with-show-${a.id}`,
        assetId: a.id,
        level: "warn",
        category: "maint-conflict",
        title: `${a.id} in maintenance with show booking`,
        detail: `Status MAINT but show "${a.show}" still assigned.`,
      });
    }

    if (a.status === "out" && a.utilization > 90) {
      issues.push({
        id: `util-${a.id}`,
        assetId: a.id,
        level: "warn",
        category: "utilization",
        title: `${a.id} utilization above 90%`,
        detail: `${a.utilization}% on "${a.show}" — schedule rest or rotate the unit.`,
      });
    }
  }

  return issues;
}

export function issuesByAsset(issues: AssetIssue[]): Map<string, AssetIssue[]> {
  const m = new Map<string, AssetIssue[]>();
  for (const i of issues) {
    const list = m.get(i.assetId);
    if (list) list.push(i);
    else m.set(i.assetId, [i]);
  }
  return m;
}
