import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { CardsSkeleton, Caps, EmptyState, Panel, PageHeader, TableSkeleton } from "@/components/ui-kit";
import { organizations, projects, useStore, userName } from "@/store/app-store";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { slaState } from "@/lib/sla";
import type { RunStatus } from "@/data/types";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Leadership Insights — KTern.AI Test Management" },
      {
        name: "description",
        content:
          "Programme-level insight widgets: run and case summaries, execution and issue trends, plan health and SLA exposure.",
      },
      { property: "og:title", content: "Leadership Insights — KTern.AI Test Management" },
      {
        property: "og:description",
        content: "Run summary, case summary, execution trend and issue trend for the whole test programme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Insights,
});

const NOW = new Date("2026-09-07T14:32:00Z").getTime();
const DAY = 86_400_000;

const statusColor: Record<RunStatus, string> = {
  Passed: "var(--pass)",
  Failed: "var(--fail)",
  Blocked: "var(--block)",
  "In Progress": "var(--run)",
  "Not Started": "var(--pending)",
};

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <Panel className="flex flex-col gap-1 p-4">
      <Caps>{label}</Caps>
      <div className={`font-display text-[30px] leading-none font-semibold ${tone ?? ""}`}>{value}</div>
      <div className="font-mono text-[10px] text-muted-foreground">{hint}</div>
    </Panel>
  );
}

function ChartPanel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <Caps>{title}</Caps>
        <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
      </div>
      <div className="h-[240px] w-full p-3">{children}</div>
    </Panel>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

function Insights() {
  const store = useStore();
  const ready = useSimulatedLoad(`${store.activeProjectId}:${store.personaId}:insights`);
  const project = projects.find((p) => p.id === store.activeProjectId)!;
  const org = organizations.find((o) => o.id === project.orgId)!;

  const runs = store.runs;
  const cases = store.cases;
  const defects = store.defects;

  const data = useMemo(() => {
    const count = (s: RunStatus) => runs.filter((r) => r.status === s).length;
    const executed = count("Passed") + count("Failed");
    const passRate = executed ? Math.round((count("Passed") / executed) * 1000) / 10 : 0;
    const progress = runs.length ? Math.round((executed / runs.length) * 100) : 0;

    const runSummary = (["Passed", "Failed", "Blocked", "In Progress", "Not Started"] as RunStatus[])
      .map((s) => ({ name: s, value: count(s) }))
      .filter((d) => d.value > 0);

    const caseSummary = (["Critical", "High", "Medium", "Low"] as const).map((p) => ({
      name: p,
      value: cases.filter((c) => c.priority === p).length,
    }));

    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(NOW - (13 - i) * DAY);
      return d.toISOString().slice(0, 10);
    });

    const executionTrend = days.map((day) => {
      const upTo = new Date(`${day}T23:59:59Z`).getTime();
      const done = runs.filter(
        (r) => r.executionEnd && new Date(r.executionEnd).getTime() <= upTo && (r.status === "Passed" || r.status === "Failed"),
      );
      return {
        day: day.slice(5),
        executed: done.length,
        failed: done.filter((r) => r.status === "Failed").length,
      };
    });

    const issuesTrend = days.map((day) => ({
      day: day.slice(5),
      raised: defects.filter((d) => d.reportedOn.slice(0, 10) === day).length,
      resolved: defects.filter((d) => d.resolvedOn && d.resolvedOn.slice(0, 10) === day).length,
    }));

    const openDefects = defects.filter((d) => !["Closed", "Rejected"].includes(d.status));
    const breached = openDefects.filter((d) => slaState(d, store.slaRules, NOW).breached).length;

    const planHealth = store.plans.map((plan) => {
      const planRuns = runs.filter((r) => r.planId === plan.id);
      const passed = planRuns.filter((r) => r.status === "Passed").length;
      const failed = planRuns.filter((r) => r.status === "Failed").length;
      const done = passed + failed;
      return {
        plan,
        total: planRuns.length,
        done,
        failed,
        pct: planRuns.length ? Math.round((done / planRuns.length) * 100) : 0,
        pass: done ? Math.round((passed / done) * 100) : 0,
      };
    });

    const covered = store.requirements.filter((req) =>
      cases.some((c) => c.requirementIds.includes(req.id)),
    ).length;

    return {
      count,
      executed,
      passRate,
      progress,
      runSummary,
      caseSummary,
      executionTrend,
      issuesTrend,
      openDefects,
      breached,
      planHealth,
      covered,
    };
  }, [runs, cases, defects, store.plans, store.requirements, store.slaRules]);

  return (
    <AppShell breadcrumbs={[org.name, project.name, "Insights"]}>
      <PageHeader
        title="Leadership Insights"
        subtitle={`${project.name} · ${runs.length} runs · ${cases.length} test cases · ${data.openDefects.length} open defects`}
        actions={
          <>
            <span className="rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">
              Viewing: last 14 days
            </span>
            <Link
              to="/reports"
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted"
            >
              Reports
            </Link>
          </>
        }
      />

      {!ready ? (
        <>
          <CardsSkeleton cards={4} />
          <TableSkeleton rows={8} label="Building insights" />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Total test cases" value={String(cases.length)} hint={`${store.scenarios.length} scenarios · ${store.requirements.length} requirements`} />
            <Kpi
              label="Execution progress"
              value={`${data.progress}%`}
              hint={`${data.executed} of ${runs.length} runs executed`}
            />
            <Kpi
              label="Pass rate"
              value={`${data.passRate}%`}
              hint={`${data.count("Passed")} passed · ${data.count("Failed")} failed`}
              tone={data.passRate >= 80 ? "text-pass" : data.passRate >= 50 ? "text-block" : "text-fail"}
            />
            <Kpi
              label="Open defects"
              value={String(data.openDefects.length)}
              hint={`${data.breached} past SLA`}
              tone={data.breached ? "text-fail" : undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartPanel title="Test run summary" hint={`${runs.length} runs`}>
              {data.runSummary.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.runSummary}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="80%"
                      paddingAngle={2}
                      stroke="var(--card)"
                    >
                      {data.runSummary.map((entry) => (
                        <Cell key={entry.name} fill={statusColor[entry.name as RunStatus]} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState>No result found — no runs in scope.</EmptyState>
              )}
            </ChartPanel>

            <ChartPanel title="Test case summary" hint="by priority">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.caseSummary} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.caseSummary.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === "Critical"
                            ? "var(--fail)"
                            : entry.name === "High"
                              ? "var(--warn)"
                              : entry.name === "Medium"
                                ? "var(--run)"
                                : "var(--pending)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <ChartPanel title="Execution trend" hint="cumulative, last 14 days">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.executionTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="executed" stroke="var(--run)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="var(--fail)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Issues trend" hint="raised vs resolved, last 14 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.issuesTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="raised" fill="var(--fail)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resolved" fill="var(--pass)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <Panel className="overflow-x-auto p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <Caps>Plan health</Caps>
              <span className="font-mono text-[10px] text-muted-foreground">{data.planHealth.length} plans</span>
            </div>
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b border-border bg-muted px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                <span>PLAN</span>
                <span>OWNER</span>
                <span>PROGRESS</span>
                <span>PASS RATE</span>
                <span>FAILED</span>
              </div>
              <div className="divide-y divide-border text-[12px]">
                {data.planHealth.map(({ plan, total, done, failed, pct, pass }) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{plan.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {plan.key} · closes {plan.endDate}
                      </div>
                    </div>
                    <div className="truncate text-muted-foreground">{userName(plan.owner)}</div>
                    <div className="font-mono text-[11px]">
                      {pct}% <span className="text-muted-foreground">({done}/{total})</span>
                    </div>
                    <div className={`font-mono text-[11px] ${pass >= 80 ? "text-pass" : pass >= 50 ? "text-block" : "text-fail"}`}>
                      {pass}%
                    </div>
                    <div className={`font-mono text-[11px] ${failed ? "text-fail" : "text-muted-foreground"}`}>{failed}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
