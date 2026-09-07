import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Download, FileText, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Button,
  Caps,
  DefectPill,
  EmptyState,
  Field,
  Modal,
  Panel,
  PageHeader,
  Select,
  StatusPill,
  TableSkeleton,
  TextArea,
  TextInput,
} from "@/components/ui-kit";
import { organizations, projects, useStore, userName } from "@/store/app-store";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — KTern.AI Test Management" },
      {
        name: "description",
        content:
          "Generate detailed execution history and requirement traceability reports for any date range and export them as CSV.",
      },
      { property: "og:title", content: "Reports — KTern.AI Test Management" },
      {
        property: "og:description",
        content: "Execution history and traceability reporting across plans, runs, requirements and defects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reports,
});

const NOW = new Date("2026-09-07T14:32:00Z");
const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

type ReportType = "Detailed Execution History" | "Traceability Report";

interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  from: string;
  to: string;
  createdBy: string;
  createdOn: string;
}

const templates: { type: ReportType; blurb: string }[] = [
  {
    type: "Detailed Execution History",
    blurb: "A comprehensive log of test case executions, including statuses, execution details, and associated test case data.",
  },
  {
    type: "Traceability Report",
    blurb: "A detailed report on traceability across Requirements, Defects, Test Cases and Test Executions to ensure comprehensive coverage.",
  },
];

function toCsv(rows: (string | number)[][]) {
  return rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Reports() {
  const store = useStore();
  const ready = useSimulatedLoad(`${store.activeProjectId}:${store.personaId}:reports`);
  const project = projects.find((p) => p.id === store.activeProjectId)!;
  const org = organizations.find((o) => o.id === project.orgId)!;

  const [reports, setReports] = useState<GeneratedReport[]>([
    {
      id: "rep-1",
      name: `${project.name} — weekly execution`,
      type: "Detailed Execution History",
      description: "Standing weekly log shared with the steering committee.",
      from: iso(new Date(NOW.getTime() - 6 * DAY)),
      to: iso(NOW),
      createdBy: "u1",
      createdOn: iso(NOW),
    },
  ]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rowQuery, setRowQuery] = useState("");

  const [form, setForm] = useState({
    type: "Detailed Execution History" as ReportType,
    name: "",
    description: "",
    from: iso(new Date(NOW.getTime() - 6 * DAY)),
    to: iso(NOW),
  });

  const open = reports.find((r) => r.id === openId) ?? null;

  const listed = reports.filter(
    (r) =>
      (!typeFilter || r.type === typeFilter) &&
      (!query || `${r.name} ${r.type}`.toLowerCase().includes(query.toLowerCase())),
  );

  const executionRows = useMemo(() => {
    if (!open) return [];
    const fromMs = new Date(`${open.from}T00:00:00Z`).getTime();
    const toMs = new Date(`${open.to}T23:59:59Z`).getTime();
    return store.runs
      .filter((r) => {
        if (!r.executionStart) return false;
        const t = new Date(r.executionStart).getTime();
        return t >= fromMs && t <= toMs;
      })
      .map((r) => {
        const tc = store.cases.find((c) => c.id === r.testCaseId);
        const plan = store.plans.find((p) => p.id === r.planId);
        return {
          id: r.id,
          key: r.key,
          caseKey: tc?.key ?? "—",
          caseName: tc?.name ?? "—",
          plan: plan?.name ?? "—",
          status: r.status,
          executedBy: userName(r.executedBy ?? r.assignee),
          environment: r.environment,
          executedOn: r.executionStart?.slice(0, 16).replace("T", " ") ?? "—",
          steps: `${r.steps.filter((s) => s.status === "Passed").length}/${r.steps.length}`,
        };
      });
  }, [open, store.runs, store.cases, store.plans]);

  const traceRows = useMemo(() => {
    if (!open) return [];
    return store.requirements.map((req) => {
      const cases = store.cases.filter((c) => c.requirementIds.includes(req.id));
      const runs = store.runs.filter((r) => cases.some((c) => c.id === r.testCaseId));
      const defects = store.defects.filter((d) => runs.some((r) => r.id === d.runId));
      const passed = runs.filter((r) => r.status === "Passed").length;
      return {
        id: req.id,
        key: req.key,
        name: req.name,
        cases: cases.length,
        runs: runs.length,
        passed,
        defects: defects.length,
        coverage: cases.length ? "Covered" : "Not covered",
        openDefect: defects.find((d) => !["Closed", "Rejected"].includes(d.status)) ?? null,
      };
    });
  }, [open, store.requirements, store.cases, store.runs, store.defects]);

  const filteredExecution = executionRows.filter((r) =>
    !rowQuery || `${r.key} ${r.caseKey} ${r.caseName}`.toLowerCase().includes(rowQuery.toLowerCase()),
  );
  const filteredTrace = traceRows.filter((r) =>
    !rowQuery || `${r.key} ${r.name}`.toLowerCase().includes(rowQuery.toLowerCase()),
  );

  const exportCsv = () => {
    if (!open) return;
    if (open.type === "Detailed Execution History") {
      download(open.name, toCsv([
        ["Run", "Case key", "Case", "Plan", "Status", "Executed by", "Environment", "Executed on", "Steps passed"],
        ...filteredExecution.map((r) => [r.key, r.caseKey, r.caseName, r.plan, r.status, r.executedBy, r.environment, r.executedOn, r.steps]),
      ]));
    } else {
      download(open.name, toCsv([
        ["Requirement", "Name", "Coverage", "Test cases", "Runs", "Passed", "Defects"],
        ...filteredTrace.map((r) => [r.key, r.name, r.coverage, r.cases, r.runs, r.passed, r.defects]),
      ]));
    }
  };

  const generate = () => {
    const name = form.name.trim();
    if (!name) return;
    const id = `rep-${reports.length + 1}-${name.length}`;
    setReports((rs) => [
      { id, name, type: form.type, description: form.description, from: form.from, to: form.to, createdBy: store.me.id, createdOn: iso(NOW) },
      ...rs,
    ]);
    setModal(false);
    setForm((f) => ({ ...f, name: "", description: "" }));
    setOpenId(id);
  };

  const breadcrumbs = [org.name, project.name, "Reports", ...(open ? [open.name] : [])];

  return (
    <AppShell breadcrumbs={breadcrumbs}>
      {open ? (
        <>
          <button
            onClick={() => { setOpenId(null); setRowQuery(""); }}
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" /> Reports
          </button>
          <PageHeader
            title={open.name}
            subtitle={`${open.type} · ${open.from} → ${open.to} · generated by ${userName(open.createdBy)}`}
            actions={
              <Button variant="ghost" onClick={exportCsv}>
                <Download className="mr-1.5 size-3.5" /> Export report as CSV
              </Button>
            }
          />

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <TextInput
                value={rowQuery}
                onChange={(e) => setRowQuery(e.target.value)}
                placeholder={open.type === "Traceability Report" ? "Search by requirement" : "Search by run or test case"}
                className="pl-9"
              />
            </div>
          </div>

          {!ready ? (
            <TableSkeleton rows={8} label="Compiling report" />
          ) : open.type === "Detailed Execution History" ? (
            <Panel className="overflow-x-auto p-0">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)] gap-2 border-b border-border bg-muted px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                  <span>RUN / CASE</span>
                  <span>PLAN</span>
                  <span>EXECUTED BY</span>
                  <span>EXECUTED ON</span>
                  <span>STEPS</span>
                  <span>STATUS</span>
                </div>
                <div className="divide-y divide-border text-[12px]">
                  {filteredExecution.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)] items-center gap-2 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.key} · {r.caseName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{r.caseKey} · {r.environment}</div>
                      </div>
                      <div className="truncate text-muted-foreground">{r.plan}</div>
                      <div className="truncate text-muted-foreground">{r.executedBy}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{r.executedOn}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{r.steps}</div>
                      <div><StatusPill status={r.status} /></div>
                    </div>
                  ))}
                  {filteredExecution.length === 0 ? (
                    <EmptyState>No result found — try adjusting the date range or search.</EmptyState>
                  ) : null}
                </div>
              </div>
            </Panel>
          ) : (
            <Panel className="overflow-x-auto p-0">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 border-b border-border bg-muted px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                  <span>REQUIREMENT</span>
                  <span>CASES</span>
                  <span>RUNS</span>
                  <span>PASSED</span>
                  <span>DEFECTS</span>
                  <span>COVERAGE</span>
                </div>
                <div className="divide-y divide-border text-[12px]">
                  {filteredTrace.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-2 px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{r.key}</div>
                      </div>
                      <div className="font-mono text-[11px]">{r.cases}</div>
                      <div className="font-mono text-[11px]">{r.runs}</div>
                      <div className="font-mono text-[11px] text-pass">{r.passed}</div>
                      <div className="font-mono text-[11px]">
                        {r.openDefect ? <DefectPill status={r.openDefect.status} /> : r.defects}
                      </div>
                      <div className={`text-[11px] font-medium ${r.cases ? "text-pass" : "text-fail"}`}>{r.coverage}</div>
                    </div>
                  ))}
                  {filteredTrace.length === 0 ? (
                    <EmptyState>No result found — try adjusting your filters.</EmptyState>
                  ) : null}
                </div>
              </div>
            </Panel>
          )}
        </>
      ) : (
        <>
          <PageHeader
            title="Reports"
            subtitle={`${project.name} · execution history and requirement traceability, exportable as CSV`}
            actions={<Button onClick={() => setModal(true)}>Generate new report</Button>}
          />

          <Panel className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-2.5">
              <Caps>Report templates</Caps>
            </div>
            <div className="divide-y divide-border">
              {templates.map((t) => (
                <button
                  key={t.type}
                  onClick={() => { setForm((f) => ({ ...f, type: t.type })); setModal(true); }}
                  className="block w-full px-4 py-3 text-left hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <FileText className="size-3.5 text-muted-foreground" />
                    {t.type}
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{t.blurb}</p>
                </button>
              ))}
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search report here" className="pl-9" />
            </div>
            <div className="w-48">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Report type">
                <option value="">Report type: All</option>
                {templates.map((t) => (
                  <option key={t.type} value={t.type}>{t.type}</option>
                ))}
              </Select>
            </div>
          </div>

          {!ready ? (
            <TableSkeleton rows={4} label="Loading reports" />
          ) : (
            <Panel className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <Caps>Reports generated</Caps>
                <span className="font-mono text-[10px] text-muted-foreground">{listed.length}</span>
              </div>
              <div className="divide-y divide-border">
                {listed.map((r) => (
                  <button key={r.id} onClick={() => setOpenId(r.id)} className="block w-full px-4 py-3 text-left hover:bg-muted/60">
                    <div className="text-[13px] font-medium">{r.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                      <span>{r.type}</span>
                      <span>·</span>
                      <span>by {userName(r.createdBy)}</span>
                      <span>·</span>
                      <span className="rounded border border-border px-1.5 py-0.5">{r.from} → {r.to}</span>
                    </div>
                  </button>
                ))}
                {listed.length === 0 ? <EmptyState>No result found — generate a report to get started.</EmptyState> : null}
              </div>
            </Panel>
          )}
        </>
      )}

      <Modal
        title="Generate report"
        open={modal}
        onClose={() => setModal(false)}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={generate} disabled={!form.name.trim()}>Generate report</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Report type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ReportType })}>
              {templates.map((t) => (
                <option key={t.type} value={t.type}>{t.type}</option>
              ))}
            </Select>
          </Field>
          <Field label="Name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sprint 12 execution history" />
          </Field>
          <Field label="From">
            <TextInput type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </Field>
          <Field label="To">
            <TextInput type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </Field>
        </div>
        <Field label="Report description">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add description (optional)"
          />
        </Field>
      </Modal>
    </AppShell>
  );
}
