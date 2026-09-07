import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Caps,
  DefectPill,
  Field,
  Meter,
  Modal,
  PageHeader,
  Panel,
  PriorityTag,
  Select,
  SeverityPill,
  TextArea,
  TextInput,
} from "@/components/ui-kit";
import { useStore, userName, users, currentUser } from "@/store/app-store";
import { ageInDays, formatDuration, slaState } from "@/lib/sla";
import type { DefectStatus, Priority, Severity } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/defects")({
  head: () => ({
    meta: [
      { title: "Defects & SLA — KTern.AI Test Management" },
      {
        name: "description",
        content: "Defect tracking with severity-driven response and resolution SLA timers, breach warnings and full comment history.",
      },
      { property: "og:title", content: "Defects & SLA — KTern.AI Test Management" },
      { property: "og:description", content: "Severity-based SLA clocks that show breaches before they hurt the go-live." },
    ],
  }),
  component: DefectsPage,
});

function DefectsPage() {
  const store = useStore();
  const now = new Date("2026-09-07T14:32:00Z").getTime();
  const [status, setStatus] = useState("All");
  const [severity, setSeverity] = useState("All");
  const [selected, setSelected] = useState<string | null>(store.defects[0]?.id ?? null);
  const [comment, setComment] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "Sev 2" as Severity,
    priority: "High" as Priority,
    assignee: "u5",
    runId: null as string | null,
  });

  const rows = store.defects.filter(
    (d) => (status === "All" || d.status === status) && (severity === "All" || d.severity === severity),
  );
  const active = store.defects.find((d) => d.id === selected);
  const sla = active ? slaState(active, store.slaRules, now) : null;
  const breached = store.defects.filter((d) => slaState(d, store.slaRules, now).breached).length;
  const atRisk = store.defects.filter((d) => slaState(d, store.slaRules, now).atRisk).length;

  return (
    <AppShell breadcrumbs={["Defects", "Nortaxis Systems", "S/4HANA Rollout — Wave 2"]}>
      <PageHeader
        title="Defects & SLA"
        subtitle={`${store.defects.length} defects · ${breached} SLA breached · ${atRisk} at risk`}
        actions={<Button onClick={() => setCreating(true)}>Log defect</Button>}
      />

      <Panel className="flex flex-wrap items-end gap-3 p-3">
        <div>
          <Caps>Status</Caps>
          <Select className="mt-1 w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            {["All", "New", "Triaged", "In Progress", "Resolved", "Closed", "Rejected"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div>
          <Caps>Severity</Caps>
          <Select className="mt-1 w-32" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {["All", "Sev 1", "Sev 2", "Sev 3", "Sev 4"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
      </Panel>

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-x-auto p-0 lg:col-span-7">
          <div className="grid grid-cols-[minmax(0,2fr)_70px_100px_minmax(0,1fr)_110px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>DEFECT</span>
            <span>SEV</span>
            <span>STATUS</span>
            <span>ASSIGNEE</span>
            <span className="text-right">SLA</span>
          </div>
          <div className="divide-y divide-border text-[12px]">
            {rows.map((d) => {
              const s = slaState(d, store.slaRules, now);
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,2fr)_70px_100px_minmax(0,1fr)_110px] items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/70",
                    selected === d.id && "bg-muted",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.title}</div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {d.key} · {ageInDays(d.reportedOn, now)}d old
                    </div>
                  </div>
                  <SeverityPill severity={d.severity} />
                  <DefectPill status={d.status} />
                  <span className="truncate text-muted-foreground">{userName(d.assignee)}</span>
                  <span
                    className={cn(
                      "text-right font-mono text-[10px]",
                      s.closed ? "text-muted-foreground" : s.breached ? "text-fail" : s.atRisk ? "text-warn" : "text-pass",
                    )}
                  >
                    {s.closed ? "closed" : s.breached ? `-${formatDuration(-s.msRemaining)}` : formatDuration(s.msRemaining)}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-5">
          {active && sla ? (
            <div>
              <div className="border-b border-border px-4 py-3">
                <Caps>Defect · {active.key}</Caps>
                <div className="font-display text-[15px] leading-tight font-semibold">{active.title}</div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">{active.description}</p>
              </div>

              <div className="border-b border-border px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <Caps>SLA · {sla.rule?.name ?? "No rule"}</Caps>
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      sla.closed ? "text-muted-foreground" : sla.breached ? "text-fail" : sla.atRisk ? "text-warn" : "text-pass",
                    )}
                  >
                    {sla.closed
                      ? "Met / closed"
                      : sla.breached
                        ? `Breached by ${formatDuration(-sla.msRemaining)}`
                        : `${formatDuration(sla.msRemaining)} remaining`}
                  </span>
                </div>
                <Meter
                  className="mt-2"
                  blocks={18}
                  segments={[
                    {
                      value: Math.min(100, sla.percentElapsed),
                      className: sla.breached ? "bg-fail" : sla.atRisk ? "bg-block" : "bg-pass",
                    },
                    { value: Math.max(0, 100 - sla.percentElapsed), className: "bg-pending/40" },
                  ]}
                />
                <div className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                  Reported {active.reportedOn.slice(0, 10)} · due {sla.dueAt ? new Date(sla.dueAt).toISOString().slice(0, 16).replace("T", " ") : "—"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-b border-border px-4 py-3 text-[11px]">
                <div>
                  <Caps>Status</Caps>
                  <Select
                    className="mt-1"
                    value={active.status}
                    onChange={(e) => store.updateDefect(active.id, { status: e.target.value as DefectStatus })}
                  >
                    {["New", "Triaged", "In Progress", "Resolved", "Closed", "Rejected"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Caps>Severity</Caps>
                  <Select
                    className="mt-1"
                    value={active.severity}
                    onChange={(e) => store.updateDefect(active.id, { severity: e.target.value as Severity })}
                  >
                    {["Sev 1", "Sev 2", "Sev 3", "Sev 4"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Caps>Assignee</Caps>
                  <Select
                    className="mt-1"
                    value={active.assignee}
                    onChange={(e) => store.updateDefect(active.id, { assignee: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="border-b border-border px-4 py-3 text-[12px]">
                <Caps className="mb-2">Origin</Caps>
                {active.runId ? (
                  <Link to="/runs/$runId" params={{ runId: active.runId }} className="underline">
                    {store.runs.find((r) => r.id === active.runId)?.key} ·{" "}
                    {store.cases.find((c) => c.id === store.runs.find((r) => r.id === active.runId)?.testCaseId)?.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Raised outside a test run</span>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <PriorityTag priority={active.priority} />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    reported by {userName(active.reportedBy)}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3">
                <Caps className="mb-2">Comments</Caps>
                <div className="space-y-2 text-[12px]">
                  {active.comments.map((c) => (
                    <div key={c.id} className="rounded-md bg-card p-2.5 border border-border">
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {userName(c.author)} · {c.on.slice(0, 16).replace("T", " ")}
                      </div>
                      <div className="mt-0.5">{c.body}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <TextInput
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Comment as ${currentUser.name}`}
                  />
                  <Button
                    onClick={() => {
                      if (!comment.trim()) return;
                      store.addDefectComment(active.id, comment);
                      setComment("");
                    }}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">Select a defect</div>
          )}
        </Panel>
      </div>

      <Modal
        title="Log defect"
        open={creating}
        onClose={() => setCreating(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.title.trim()) return;
                store.addDefect(form);
                setForm({ ...form, title: "", description: "" });
                setCreating(false);
              }}
            >
              Create defect
            </Button>
          </>
        }
      >
        <Field label="Title">
          <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Description">
          <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Severity">
            <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}>
              {["Sev 1", "Sev 2", "Sev 3", "Sev 4"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              {["Critical", "High", "Medium", "Low"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Linked run (optional)">
          <Select value={form.runId ?? ""} onChange={(e) => setForm({ ...form, runId: e.target.value || null })}>
            <option value="">No run</option>
            {store.runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.key} · {store.cases.find((c) => c.id === r.testCaseId)?.name}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </AppShell>
  );
}
