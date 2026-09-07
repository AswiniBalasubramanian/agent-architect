import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Caps, PageHeader, Panel, PriorityTag, Select, StatusPill, TextInput } from "@/components/ui-kit";
import { useStore, userName, users, runCounts } from "@/store/app-store";
import type { RunStatus } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/")({
  head: () => ({
    meta: [
      { title: "Test Runs — KTern.AI Test Management" },
      {
        name: "description",
        content: "Every planned test execution in one dense grid: status, assignee, environment, version and linked defects.",
      },
      { property: "og:title", content: "Test Runs — KTern.AI Test Management" },
      { property: "og:description", content: "Execute, reassign and track every test run across plans and environments." },
    ],
  }),
  component: RunsPage,
});

function RunsPage() {
  const store = useStore();
  const [status, setStatus] = useState<"All" | RunStatus>("All");
  const [plan, setPlan] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<string[]>([]);

  const rows = store.runs.filter((r) => {
    const c = store.cases.find((x) => x.id === r.testCaseId);
    return (
      (status === "All" || r.status === status) &&
      (plan === "All" || r.planId === plan) &&
      (assignee === "All" || r.assignee === assignee) &&
      (query === "" || `${r.key} ${c?.name ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    );
  });
  const counts = runCounts(store.runs);

  return (
    <AppShell breadcrumbs={["Test Runs", "Nortaxis Systems", "S/4HANA Rollout — Wave 2"]}>
      <PageHeader
        title="Test Runs"
        subtitle={`${store.runs.length} runs · ${counts.Passed} passed · ${counts.Failed} failed · ${counts["Not Started"]} not started`}
        actions={<TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search runs…" className="w-52" />}
      />

      <Panel className="flex flex-wrap items-end gap-3 p-3">
        <div>
          <Caps>Status</Caps>
          <Select className="mt-1 w-40" value={status} onChange={(e) => setStatus(e.target.value as RunStatus | "All")}>
            {["All", "Not Started", "In Progress", "Passed", "Failed", "Blocked"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div>
          <Caps>Plan</Caps>
          <Select className="mt-1 w-56" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="All">All plans</option>
            {store.plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Caps>Assignee</Caps>
          <Select className="mt-1 w-48" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="All">Everyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        {checked.length > 0 ? (
          <div className="ml-auto flex items-end gap-2">
            <div>
              <Caps>Bulk reassign {checked.length} runs</Caps>
              <Select
                className="mt-1 w-48"
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  checked.forEach((id) => store.updateRun(id, { assignee: e.target.value }));
                  setChecked([]);
                }}
              >
                <option value="">Choose tester…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="ghost" onClick={() => setChecked([])}>
              Clear
            </Button>
          </div>
        ) : null}
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="grid grid-cols-[32px_80px_minmax(0,2fr)_110px_90px_70px_minmax(0,1fr)_60px] gap-2 border-b border-line px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
          <span />
          <span>RUN</span>
          <span>TEST CASE</span>
          <span>STATUS</span>
          <span>ENV</span>
          <span>PRIORITY</span>
          <span>ASSIGNEE</span>
          <span className="text-right">DEF</span>
        </div>
        <div className="divide-y divide-line/70 text-[12px]">
          {rows.map((r) => {
            const c = store.cases.find((x) => x.id === r.testCaseId);
            const defects = store.defects.filter((d) => d.runId === r.id).length;
            return (
              <div
                key={r.id}
                className={cn(
                  "grid grid-cols-[32px_80px_minmax(0,2fr)_110px_90px_70px_minmax(0,1fr)_60px] items-center gap-2 px-4 py-2 hover:bg-white/70",
                  checked.includes(r.id) && "bg-accent/5",
                )}
              >
                <input
                  type="checkbox"
                  aria-label={`Select ${r.key}`}
                  checked={checked.includes(r.id)}
                  onChange={(e) => setChecked(e.target.checked ? [...checked, r.id] : checked.filter((x) => x !== r.id))}
                  className="size-3.5 accent-[var(--accent)]"
                />
                <Link to="/runs/$runId" params={{ runId: r.id }} className="font-mono text-[10px] text-muted-foreground hover:text-ink">
                  {r.key}
                </Link>
                <Link to="/runs/$runId" params={{ runId: r.id }} className="min-w-0">
                  <div className="truncate font-medium">{c?.name}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {c?.key} · v{r.versionNo}
                  </div>
                </Link>
                <Select
                  value={r.status}
                  onChange={(e) => store.updateRun(r.id, { status: e.target.value as RunStatus })}
                  className="h-6 py-0 text-[11px]"
                >
                  {["Not Started", "In Progress", "Passed", "Failed", "Blocked"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
                <span className="font-mono text-[10px] text-muted-foreground">{r.environment}</span>
                <PriorityTag priority={r.priority} />
                <span className="truncate text-muted-foreground">{userName(r.assignee)}</span>
                <span className={cn("text-right font-mono text-[11px]", defects ? "text-fail" : "text-muted-foreground")}>
                  {defects}
                </span>
              </div>
            );
          })}
          {rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">No runs match these filters</div>
          ) : null}
        </div>
      </Panel>
      <div className="flex flex-wrap gap-3 font-mono text-[10px] text-muted-foreground">
        {(Object.keys(counts) as RunStatus[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <StatusPill status={k} /> {counts[k]}
          </span>
        ))}
      </div>
    </AppShell>
  );
}
