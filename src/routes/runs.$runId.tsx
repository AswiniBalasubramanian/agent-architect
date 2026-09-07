import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Caps,
  Field,
  Modal,
  PageHeader,
  Panel,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/ui-kit";
import { useStore, userName, users } from "@/store/app-store";
import type { Priority, RunStatus, Severity, StepStatus } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/$runId")({
  head: () => ({
    meta: [
      { title: "Run Execution — KTern.AI Test Management" },
      {
        name: "description",
        content: "Execute a test run step by step, capture actual results and raise defects against the exact failing step.",
      },
      { property: "og:title", content: "Run Execution — KTern.AI Test Management" },
      { property: "og:description", content: "Step-by-step execution with evidence capture and one-click defect logging." },
    ],
  }),
  component: RunDetail,
});

const STEP_STATUSES: StepStatus[] = ["Not Started", "Passed", "Failed", "Blocked"];

function RunDetail() {
  const { runId } = useParams({ from: "/runs/$runId" });
  const store = useStore();
  const run = store.runs.find((r) => r.id === runId);
  const canExecute = store.can("execute");
  const canRaise = store.can("raiseDefect");
  const [defectOpen, setDefectOpen] = useState(false);
  const [defect, setDefect] = useState({
    title: "",
    description: "",
    severity: "High" as Severity,
    priority: "High" as Priority,
    assignee: "u5",
  });

  if (!run) {
    return (
      <AppShell breadcrumbs={["Test Runs", "Not found"]}>
        <Panel className="p-10 text-center text-[12px] text-muted-foreground">
          This run is not in scope for the current project or persona.{" "}
          <Link to="/runs" className="underline">
            Back to runs
          </Link>
        </Panel>
      </AppShell>
    );
  }

  const testCase = store.cases.find((c) => c.id === run.testCaseId);
  const plan = store.plans.find((p) => p.id === run.planId);
  const defects = store.defects.filter((d) => d.runId === run.id);
  const done = run.steps.filter((s) => s.status !== "Not Started").length;

  return (
    <AppShell breadcrumbs={["Test Runs", plan?.name ?? "Plan", run.key]}>
      <PageHeader
        title={testCase?.name ?? run.key}
        subtitle={`${run.key} · ${testCase?.key} v${run.versionNo} · ${run.environment} · assigned to ${userName(run.assignee)}`}
        actions={
          <>
            {canRaise ? (
              <Button variant="ghost" onClick={() => setDefectOpen(true)}>
                Log defect
              </Button>
            ) : null}
            <Select
              value={run.status}
              onChange={(e) => store.updateRun(run.id, { status: e.target.value as RunStatus })}
              className="w-36"
            >
              {["Not Started", "In Progress", "Passed", "Failed", "Blocked"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <Caps>Execution steps</Caps>
            <span className="font-mono text-[10px] text-muted-foreground">
              {done}/{run.steps.length} executed
            </span>
          </div>
          <div className="divide-y divide-border">
            {run.steps.map((s) => (
              <div key={s.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px]">
                    {s.stepNo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold">{s.title}</div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">{s.instruction}</div>
                    <div className="mt-1 text-[11.5px]">
                      <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">EXPECTED · </span>
                      {s.expected}
                    </div>
                    <TextInput
                      className="mt-2"
                      disabled={!canExecute}
                      placeholder={canExecute ? "Actual result / evidence note" : "Read-only for this persona"}
                      value={s.actual ?? ""}
                      onChange={(e) => store.setRunStepStatus(run.id, s.id, s.status, e.target.value)}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {STEP_STATUSES.map((st) => (
                      <button
                        key={st}
                        disabled={!canExecute}
                        onClick={() => store.setRunStepStatus(run.id, s.id, st, s.actual)}
                        className={cn(
                          "rounded-md px-2 py-1 font-mono text-[10px] ring-1 transition-colors disabled:opacity-40",
                          s.status === st
                            ? "bg-primary text-primary-foreground ring-transparent"
                            : "bg-card text-muted-foreground ring-line hover:bg-muted",
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="col-span-12 space-y-3 lg:col-span-4">
          <Panel className="p-4">
            <Caps className="mb-2">Run detail</Caps>
            <dl className="space-y-2 text-[12px]">
              <Row label="Status">
                <StatusPill status={run.status} />
              </Row>
              <Row label="Plan">{plan?.name}</Row>
              <Row label="Environment">{run.environment}</Row>
              <Row label="Version">v{run.versionNo} (pinned)</Row>
              <Row label="Executed by">{run.executedBy ? userName(run.executedBy) : "—"}</Row>
              <Row label="Started">{run.executionStart?.slice(0, 16).replace("T", " ") ?? "—"}</Row>
              <Row label="Finished">{run.executionEnd?.slice(0, 16).replace("T", " ") ?? "—"}</Row>
            </dl>
            <div className="mt-3">
              <Caps>Reassign</Caps>
              <Select
                className="mt-1"
                value={run.assignee}
                onChange={(e) => store.updateRun(run.id, { assignee: e.target.value })}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </div>
          </Panel>

          <Panel className="p-4">
            <Caps className="mb-2">Linked defects · {defects.length}</Caps>
            <div className="space-y-2 text-[12px]">
              {defects.map((d) => (
                <Link key={d.id} to="/defects" className="block rounded-md bg-card p-2.5 border border-border hover:bg-muted">
                  <div className="truncate font-medium">{d.title}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {d.key} · {d.severity} · {d.status}
                  </div>
                </Link>
              ))}
              {defects.length === 0 ? (
                <span className="font-mono text-[11px] text-muted-foreground">No defects raised</span>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        title="Log defect from this run"
        open={defectOpen}
        onClose={() => setDefectOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDefectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!defect.title.trim()) return;
                store.addDefect({ ...defect, runId: run.id });
                setDefect({ ...defect, title: "", description: "" });
                setDefectOpen(false);
              }}
            >
              Create defect
            </Button>
          </>
        }
      >
        <Field label="Title">
          <TextInput value={defect.title} onChange={(e) => setDefect({ ...defect, title: e.target.value })} />
        </Field>
        <Field label="Description">
          <TextArea value={defect.description} onChange={(e) => setDefect({ ...defect, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Severity">
            <Select value={defect.severity} onChange={(e) => setDefect({ ...defect, severity: e.target.value as Severity })}>
              {["Critical", "High", "Medium", "Low"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={defect.priority} onChange={(e) => setDefect({ ...defect, priority: e.target.value as Priority })}>
              {["Critical", "High", "Medium", "Low"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={defect.assignee} onChange={(e) => setDefect({ ...defect, assignee: e.target.value })}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">{label}</dt>
      <dd className="truncate text-right">{children}</dd>
    </div>
  );
}
