import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Caps, Panel, PageHeader, StatusPill, SeverityPill } from "@/components/ui-kit";
import { useStore, userName } from "@/store/app-store";
import { formatDuration, slaState } from "@/lib/sla";
import type { RunStatus } from "@/data/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Execution Dashboard — KTern.AI Test Management" },
      {
        name: "description",
        content:
          "Live pass/fail rollups, SLA watch and requirement coverage for SAP and non-SAP test delivery in one console.",
      },
      { property: "og:title", content: "Execution Dashboard — KTern.AI Test Management" },
      {
        property: "og:description",
        content: "Live pass/fail rollups, SLA watch and requirement coverage across every test plan.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const store = useStore();
  const now = new Date("2026-09-07T14:32:00Z").getTime();
  const runs = store.runs.filter((r) => r.projectId === store.activeProjectId);
  const count = (s: RunStatus) => runs.filter((r) => r.status === s).length;
  const executed = count("Passed") + count("Failed");
  const passRate = executed ? Math.round((count("Passed") / executed) * 1000) / 10 : 0;

  const openDefects = store.defects.filter((d) => !["Closed", "Rejected"].includes(d.status));
  const slaWatch = openDefects
    .map((d) => ({ defect: d, sla: slaState(d, store.slaRules, now) }))
    .filter((x) => !x.sla.closed)
    .sort((a, b) => a.sla.msRemaining - b.sla.msRemaining)
    .slice(0, 4);

  const coverage = store.requirements.map((req) => {
    const cases = store.cases.filter((c) => c.requirementIds.includes(req.id));
    const reqRuns = runs.filter((r) => cases.some((c) => c.id === r.testCaseId));
    const passed = reqRuns.filter((r) => r.status === "Passed").length;
    return { req, cases: cases.length, runs: reqRuns.length, passed };
  });
  const covered = coverage.filter((c) => c.cases > 0).length;

  const byPlan = store.plans
    .filter((p) => p.projectId === store.activeProjectId)
    .map((plan) => {
      const planRuns = runs.filter((r) => r.planId === plan.id);
      const done = planRuns.filter((r) => r.status === "Passed" || r.status === "Failed").length;
      return { plan, total: planRuns.length, done, failed: planRuns.filter((r) => r.status === "Failed").length };
    });

  return (
    <AppShell breadcrumbs={["Dashboard", "Nortaxis Systems", "Sprint 14"]}>
      <PageHeader
        title="Execution Dashboard"
        subtitle={`${runs.length} runs in scope · ${store.cases.length} master test cases · ${openDefects.length} open defects`}
        actions={
          <>
            <span className="rounded-md bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground border border-border">
              Env: <b className="text-foreground">dev-sap-04</b>
            </span>
            <span className="rounded-md bg-card px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground border border-border">
              ⏱ {slaWatch.filter((s) => s.sla.breached || s.sla.atRisk).length} SLA at risk
            </span>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-7">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold">Execution progress</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Overall result for the current testing scope</p>
          </div>
          <div className="grid items-center gap-6 px-5 py-5 sm:grid-cols-[190px_1fr]">
            <div className="relative mx-auto size-44" aria-label={`${passRate}% pass rate`}>
              <svg className="size-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="14" className="text-muted" />
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  pathLength="100"
                  strokeDasharray={`${passRate} ${100 - passRate}`}
                  className="text-pass"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-[27px] leading-none font-semibold">{passRate}%</span>
                <span className="mt-1 font-mono text-[10px] text-muted-foreground">{count("Passed")} of {executed} passed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: "Passed", value: count("Passed"), tone: "bg-pass" },
                { label: "Failed", value: count("Failed"), tone: "bg-fail" },
                { label: "In progress", value: count("In Progress"), tone: "bg-run" },
                { label: "Blocked", value: count("Blocked"), tone: "bg-block" },
              ].map((item) => (
                <div key={item.label} className="border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={`size-2 rounded-full ${item.tone}`} />
                    {item.label}
                  </div>
                  <div className="mt-1 font-display text-xl font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
            <span>{runs.length} total runs</span>
            <Link to="/runs" className="font-medium text-foreground hover:text-primary">View executions →</Link>
          </div>
        </Panel>

        <Panel className="col-span-6 flex flex-col justify-between p-4 lg:col-span-2">
          <Caps>Defects</Caps>
          <div className="font-display text-[30px] leading-none font-semibold">{openDefects.length}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="size-1.5 rounded-full bg-fail" />
            <span className="font-mono text-fail">
              {openDefects.filter((d) => slaState(d, store.slaRules, now).breached).length} SLA breach
            </span>
          </div>
        </Panel>

        <Panel className="col-span-6 flex flex-col justify-between p-4 lg:col-span-3">
          <Caps>Requirement coverage</Caps>
          <div className="font-display text-[26px] leading-none font-semibold">
            {Math.round((covered / store.requirements.length) * 100)}%
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(covered / store.requirements.length) * 100}%` }} />
          </div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
            {covered} of {store.requirements.length} requirements have test cases
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <Caps>Test plans · {byPlan.length}</Caps>
            <Link to="/plans" className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
              view all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {byPlan.map(({ plan, total, done, failed }) => (
              <Link
                key={plan.id}
                to="/plans"
                className="block px-4 py-3 hover:bg-muted/70"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">
                      {plan.key} · {plan.name}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {userName(plan.owner)} · {plan.defaultEnvironment} · closes {plan.endDate}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-muted-foreground">
                    {done}/{total} executed
                    {failed ? <span className="ml-2 text-fail">{failed} failed</span> : null}
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-pass" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <Caps>SLA watch</Caps>
            <Link to="/defects" className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
              all defects →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {slaWatch.map(({ defect, sla }) => (
              <div key={defect.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-muted-foreground">{defect.key}</div>
                    <div className="truncate text-[12.5px] font-medium">{defect.title}</div>
                  </div>
                  <div className="text-right">
                    <SeverityPill severity={defect.severity} />
                    <div className={`mt-1 font-mono text-[11px] ${sla.breached ? "text-fail" : "text-warn"}`}>
                      {sla.breached ? "breached " : ""}
                      {formatDuration(sla.msRemaining)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${sla.breached ? "bg-fail" : "bg-warn"}`}
                    style={{ width: `${sla.percentElapsed}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-x-auto p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <Caps>Latest executions</Caps>
          <Link to="/runs" className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
            all runs →
          </Link>
        </div>
        <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
          <span>RUN / CASE</span>
          <span>OWNER</span>
          <span>ENV</span>
          <span>STATUS</span>
        </div>
        <div className="divide-y divide-border text-[12px]">
          {runs
            .filter((r) => r.executionStart)
            .slice(0, 8)
            .map((run) => {
              const tc = store.cases.find((c) => c.id === run.testCaseId)!;
              return (
                <Link
                  key={run.id}
                  to="/runs/$runId"
                  params={{ runId: run.id }}
                  className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-2 px-4 py-2.5 hover:bg-muted/70"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {run.key} · {tc.name}
                    </div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {tc.key} · v{run.versionNo}
                    </div>
                  </div>
                  <div className="truncate text-muted-foreground">{userName(run.assignee)}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">{run.environment}</div>
                  <div>
                    <StatusPill status={run.status} />
                  </div>
                </Link>
              );
            })}
        </div>
      </Panel>
    </AppShell>
  );
}
