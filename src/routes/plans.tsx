import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Caps,
  Field,
  Legend,
  Meter,
  Modal,
  PageHeader,
  Panel,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/ui-kit";
import { organizations, projects, useStore, userName, users, runCounts } from "@/store/app-store";
import { CardsSkeleton, TableSkeleton } from "@/components/ui-kit";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import type { TestPlan } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Test Plans — KTern.AI Test Management" },
      {
        name: "description",
        content: "Project test plans with scheduled windows, environments, assigned owners and live pass/fail rollups per plan.",
      },
      { property: "og:title", content: "Test Plans — KTern.AI Test Management" },
      { property: "og:description", content: "Scheduled test plans with live execution rollups and run assignment." },
    ],
  }),
  component: PlansPage,
});

export function PlanRollup({ planId }: { planId: string }) {
  const store = useStore();
  const runs = store.runs.filter((r) => r.planId === planId);
  const r = runCounts(runs);
  return (
    <div>
      <Meter
        segments={[
          { value: r.Passed, className: "bg-pass" },
          { value: r.Failed, className: "bg-fail" },
          { value: r.Blocked, className: "bg-block" },
          { value: r["In Progress"], className: "bg-run" },
          { value: r["Not Started"], className: "bg-pending" },
        ]}
      />
      <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
        {runs.length} runs · {r.Passed} passed · {r.Failed} failed · {r.Blocked} blocked
      </div>
    </div>
  );
}

function PlansPage() {
  const store = useStore();
  const [selected, setSelected] = useState<string | null>(store.plans[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [form, setForm] = useState<Omit<TestPlan, "id" | "key" | "projectId">>({
    name: "",
    description: "",
    status: "Planned",
    owner: "u3",
    startDate: "2026-09-07",
    endDate: "2026-09-21",
    defaultEnvironment: "QA",
    testingType: "System Integration",
  });

  const active = store.plans.find((p) => p.id === selected);
  const runs = active ? store.runs.filter((r) => r.planId === active.id) : [];
  const roll = runCounts(runs);

  const ready = useSimulatedLoad(`${store.activeProjectId}:${store.personaId}`);
  const project = projects.find((p) => p.id === store.activeProjectId)!;
  const org = organizations.find((o) => o.id === project.orgId)!;
  const canEdit = store.can("managePlans");

  if (!ready) {
    return (
      <AppShell breadcrumbs={[org.name, project.name, "Test Plans"]}>
        <PageHeader title="Test Plans" subtitle="Loading this workspace…" />
        <CardsSkeleton />
        <TableSkeleton rows={8} />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[org.name, project.name, "Test Plans"]}>
      <PageHeader
        title="Test Plans"
        subtitle={`${store.plans.length} plans in this project · runs are created by adding test cases to a plan`}
        actions={<Button onClick={() => setCreating(true)}>New test plan</Button>}
      />

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-5">
          <div className="border-b border-border px-4 py-2.5">
            <Caps>Plans</Caps>
          </div>
          <div className="divide-y divide-border">
            {store.plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn("block w-full px-4 py-3 text-left hover:bg-muted/70", selected === p.id && "bg-muted")}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium">{p.name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{p.status}</span>
                </div>
                <div className="mb-2 font-mono text-[10px] text-muted-foreground">
                  {p.key} · {p.startDate} → {p.endDate} · {p.defaultEnvironment}
                </div>
                <PlanRollup planId={p.id} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-7">
          {active ? (
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <Caps>Plan · {active.key}</Caps>
                  <div className="font-display text-[15px] leading-tight font-semibold">{active.name}</div>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{active.description}</p>
                </div>
                <Button onClick={() => { setPicked([]); setAssigning(true); }}>Add test cases</Button>
              </div>

              <div className="grid grid-cols-4 gap-3 border-b border-border px-4 py-3 text-[11px]">
                <div>
                  <Caps>Status</Caps>
                  <Select
                    className="mt-1"
                    value={active.status}
                    onChange={(e) => store.updatePlan(active.id, { status: e.target.value as TestPlan["status"] })}
                  >
                    {["Planned", "In Progress", "Completed", "On Hold"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Caps>Owner</Caps>
                  <div className="mt-1.5 font-semibold">{userName(active.owner)}</div>
                </div>
                <div>
                  <Caps>Environment</Caps>
                  <div className="mt-1.5 font-mono">{active.defaultEnvironment}</div>
                </div>
                <div>
                  <Caps>Window</Caps>
                  <div className="mt-1.5 font-mono">
                    {active.startDate} → {active.endDate}
                  </div>
                </div>
              </div>

              <div className="border-b border-border px-4 py-3">
                <Caps className="mb-2">Execution rollup</Caps>
                <Meter
                  segments={[
                    { value: roll.Passed, className: "bg-pass" },
                    { value: roll.Failed, className: "bg-fail" },
                    { value: roll.Blocked, className: "bg-block" },
                    { value: roll["In Progress"], className: "bg-run" },
                    { value: roll["Not Started"], className: "bg-pending" },
                  ]}
                />
                <Legend
                  items={[
                    { label: "Passed", value: roll.Passed, dot: "bg-pass" },
                    { label: "Failed", value: roll.Failed, dot: "bg-fail" },
                    { label: "Blocked", value: roll.Blocked, dot: "bg-block" },
                    { label: "In progress", value: roll["In Progress"], dot: "bg-run" },
                    { label: "Not started", value: roll["Not Started"], dot: "bg-pending" },
                  ]}
                />
              </div>

              <div className="max-h-[380px] overflow-auto">
                <div className="grid grid-cols-[70px_minmax(0,2fr)_110px_minmax(0,1fr)] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                  <span>RUN</span>
                  <span>TEST CASE</span>
                  <span>STATUS</span>
                  <span>ASSIGNEE</span>
                </div>
                <div className="divide-y divide-border text-[12px]">
                  {runs.map((r) => (
                    <Link
                      key={r.id}
                      to="/runs/$runId"
                      params={{ runId: r.id }}
                      className="grid grid-cols-[70px_minmax(0,2fr)_110px_minmax(0,1fr)] items-center gap-2 px-4 py-2 hover:bg-muted/70"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">{r.key}</span>
                      <span className="truncate">{store.cases.find((c) => c.id === r.testCaseId)?.name}</span>
                      <StatusPill status={r.status} />
                      <span className="truncate text-muted-foreground">{userName(r.assignee)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">Select a plan</div>
          )}
        </Panel>
      </div>

      <Modal
        title="Add test cases to plan"
        open={assigning}
        wide
        onClose={() => setAssigning(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssigning(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!active || picked.length === 0) return;
                store.addRunsToPlan(active.id, picked, null);
                setAssigning(false);
              }}
            >
              Create {picked.length} runs
            </Button>
          </>
        }
      >
        <p className="text-[11.5px] text-muted-foreground">
          Each selected case is copied into the plan as a run, pinned to its current version.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {store.scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setPicked([...new Set([...picked, ...s.members.map((m) => m.testCaseId)])])}
              className="rounded-md bg-card px-2 py-1 font-mono text-[10px] border border-border hover:bg-muted"
            >
              + {s.name}
            </button>
          ))}
        </div>
        <div className="max-h-[360px] space-y-1 overflow-y-auto">
          {store.cases.map((c) => {
            const on = picked.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setPicked(on ? picked.filter((x) => x !== c.id) : [...picked, c.id])}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[12px] ring-1",
                  on ? "bg-accent/10 ring-accent/30" : "bg-card ring-line",
                )}
              >
                <span className="truncate">{c.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {c.key} · v{c.versions.length}
                </span>
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        title="New test plan"
        open={creating}
        onClose={() => setCreating(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                store.addPlan(form);
                setForm({ ...form, name: "", description: "" });
                setCreating(false);
              }}
            >
              Create plan
            </Button>
          </>
        }
      >
        <Field label="Name">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Description">
          <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <TextInput type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="End date">
            <TextInput type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <Field label="Owner">
            <Select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Environment">
            <Select
              value={form.defaultEnvironment}
              onChange={(e) => setForm({ ...form, defaultEnvironment: e.target.value })}
            >
              {store.config
                .filter((c) => c.group === "Environment" && c.active)
                .map((c) => (
                  <option key={c.id}>{c.value}</option>
                ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </AppShell>
  );
}
