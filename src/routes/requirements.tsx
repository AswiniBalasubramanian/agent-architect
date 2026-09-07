import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Caps,
  Field,
  Modal,
  PageHeader,
  Panel,
  PriorityTag,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui-kit";
import { organizations, projects, useStore, userName, users } from "@/store/app-store";
import { CardsSkeleton, TableSkeleton } from "@/components/ui-kit";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import type { Priority } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/requirements")({
  head: () => ({
    meta: [
      { title: "Requirements — KTern.AI Test Management" },
      {
        name: "description",
        content: "Traceable business requirements linked to processes, test cases and defects, with live test preparation status.",
      },
      { property: "og:title", content: "Requirements — KTern.AI Test Management" },
      { property: "og:description", content: "Requirement to test case to defect traceability, without manual cross-referencing." },
    ],
  }),
  component: RequirementsPage,
});

function RequirementsPage() {
  const store = useStore();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(store.requirements[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", priority: "Medium" as Priority, status: "Draft", owner: "u2" });

  const statuses = store.config.filter((c) => c.group === "Requirement Status" && c.active);
  const list = store.requirements.filter(
    (r) =>
      (filter === "All" || r.status === filter) &&
      (query === "" || r.name.toLowerCase().includes(query.toLowerCase())),
  );
  const active = store.requirements.find((r) => r.id === selected);
  const linkedCases = active ? store.cases.filter((c) => c.requirementIds.includes(active.id)) : [];
  const linkedRuns = store.runs.filter((r) => linkedCases.some((c) => c.id === r.testCaseId));
  const linkedDefects = store.defects.filter((d) => linkedRuns.some((r) => r.id === d.runId));

  const ready = useSimulatedLoad(`${store.activeProjectId}:${store.personaId}`);
  const project = projects.find((p) => p.id === store.activeProjectId)!;
  const org = organizations.find((o) => o.id === project.orgId)!;
  const canEdit = store.can("authorMaster");

  if (!ready) {
    return (
      <AppShell breadcrumbs={[org.name, project.name, "Requirements"]}>
        <PageHeader title="Requirements" subtitle="Loading this workspace…" />
        <CardsSkeleton />
        <TableSkeleton rows={8} />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[org.name, project.name, "Requirements"]}>
      <PageHeader
        title="Requirements"
        subtitle={`${store.requirements.length} requirements · sourced from documents, integrations and prior projects`}
        actions={
          <>
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter requirements…"
              className="w-52"
            />
            {canEdit ? <Button onClick={() => setCreating(true)}>New requirement</Button> : null}
          </>
        }
      />

      <div className="flex flex-wrap gap-1">
        {["All", ...statuses.map((s) => s.value)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-md px-2.5 py-1 font-mono text-[11px]",
              filter === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-x-auto p-0 lg:col-span-7">
          <div className="grid grid-cols-[minmax(0,2fr)_100px_110px_minmax(0,1fr)_70px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>REQUIREMENT</span>
            <span>PRIORITY</span>
            <span>STATUS</span>
            <span>OWNER</span>
            <span className="text-right">CASES</span>
          </div>
          <div className="divide-y divide-border text-[12px]">
            {list.map((req) => {
              const cases = store.cases.filter((c) => c.requirementIds.includes(req.id)).length;
              return (
                <button
                  key={req.id}
                  onClick={() => setSelected(req.id)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,2fr)_100px_110px_minmax(0,1fr)_70px] items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/70",
                    selected === req.id && "bg-muted",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{req.name}</div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {req.id.toUpperCase()} · {req.sourceType}
                    </div>
                  </div>
                  <PriorityTag priority={req.priority} />
                  <span className="font-mono text-[10px] text-muted-foreground">{req.status}</span>
                  <span className="truncate text-muted-foreground">{userName(req.owner)}</span>
                  <span className={cn("text-right font-mono text-[11px]", cases ? "text-foreground" : "text-fail")}>{cases}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-5">
          {active ? (
            <div>
              <div className="border-b border-border px-4 py-3">
                <Caps>Requirement detail</Caps>
                <div className="font-display text-[15px] leading-tight font-semibold">{active.name}</div>
                <p className="mt-1.5 text-[12px] text-muted-foreground">{active.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 border-b border-border px-4 py-3 text-[11px]">
                <div>
                  <Caps>Status</Caps>
                  <Select
                    className="mt-1"
                    value={active.status}
                    onChange={(e) => store.updateRequirement(active.id, { status: e.target.value })}
                  >
                    {statuses.map((s) => (
                      <option key={s.id}>{s.value}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Caps>Priority</Caps>
                  <Select
                    className="mt-1"
                    value={active.priority}
                    onChange={(e) => store.updateRequirement(active.id, { priority: e.target.value as Priority })}
                  >
                    {["Critical", "High", "Medium", "Low"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Caps>Owner</Caps>
                  <Select
                    className="mt-1"
                    value={active.owner}
                    onChange={(e) => store.updateRequirement(active.id, { owner: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="border-b border-border px-4 py-3">
                <Caps className="mb-2">Mapped processes</Caps>
                <div className="flex flex-wrap gap-1.5">
                  {active.processIds.map((pid) => (
                    <span key={pid} className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {store.processes.find((p) => p.id === pid)?.name ?? pid}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-b border-border px-4 py-3">
                <Caps className="mb-2">Test preparation · {linkedCases.length} cases</Caps>
                <div className="space-y-1.5 text-[12px]">
                  {linkedCases.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {c.key} · v{c.versions.length}
                      </span>
                    </div>
                  ))}
                  {linkedCases.length === 0 ? (
                    <span className="font-mono text-[11px] text-fail">No test coverage yet</span>
                  ) : null}
                </div>
              </div>

              <div className="px-4 py-3">
                <Caps className="mb-2">Traceability</Caps>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="font-display text-[20px] font-semibold">{linkedCases.length}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">test cases</div>
                  </div>
                  <div>
                    <div className="font-display text-[20px] font-semibold">{linkedRuns.length}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">runs</div>
                  </div>
                  <div>
                    <div className="font-display text-[20px] font-semibold text-fail">{linkedDefects.length}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">defects</div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="danger" onClick={() => { store.deleteRequirement(active.id); setSelected(null); }}>
                    Delete requirement
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">Select a requirement</div>
          )}
        </Panel>
      </div>

      <Modal
        title="New requirement"
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
                store.addRequirement(form);
                setForm({ ...form, name: "", description: "" });
                setCreating(false);
              }}
            >
              Create requirement
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
        <div className="grid grid-cols-3 gap-3">
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((s) => (
                <option key={s.id}>{s.value}</option>
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
          <Field label="Owner">
            <Select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
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
