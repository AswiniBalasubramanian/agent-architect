import type { Defect, SlaRule } from "@/data/types";

const HOUR = 1000 * 60 * 60;

export interface SlaState {
  rule?: SlaRule | undefined;
  dueAt: number;
  msRemaining: number;
  breached: boolean;
  atRisk: boolean;
  closed: boolean;
  percentElapsed: number;
}

export function slaState(defect: Defect, rules: SlaRule[], now = Date.now()): SlaState {
  const rule = rules.find((r) => r.id === defect.slaRuleId);
  const started = new Date(defect.reportedOn).getTime();
  const hours = rule?.resolutionHours ?? 72;
  const dueAt = started + hours * HOUR;
  const closed = defect.status === "Resolved" || defect.status === "Closed" || defect.status === "Rejected";
  const reference = closed && defect.resolvedOn ? new Date(defect.resolvedOn).getTime() : now;
  const msRemaining = dueAt - reference;
  const elapsed = Math.min(100, Math.max(0, ((reference - started) / (hours * HOUR)) * 100));
  return {
    rule,
    dueAt,
    msRemaining,
    breached: msRemaining < 0,
    atRisk: !closed && msRemaining >= 0 && msRemaining < hours * HOUR * 0.25,
    closed,
    percentElapsed: elapsed,
  };
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / HOUR);
  const m = Math.floor((abs % HOUR) / (1000 * 60));
  const s = Math.floor((abs % (1000 * 60)) / 1000);
  const body = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return ms < 0 ? `-${body}` : body;
}

export function ageInDays(iso: string, now = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / (24 * HOUR)));
}
