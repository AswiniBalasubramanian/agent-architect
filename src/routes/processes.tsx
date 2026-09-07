import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Grid3X3, ListTree, SlidersHorizontal, Columns3, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Caps, Field, Modal, PageHeader, Panel, Select, TextInput } from "@/components/ui-kit";
import { useStore, userName, users } from "@/store/app-store";
import type { BusinessProcess } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processes")({
  head: () => ({
    meta: [
      { title: "Business Processes — KTern.AI Test Management" },
      {
        name: "description",
        content: "Self-nesting SAP and non-SAP process hierarchy with WBS grid view, ownership and live test coverage.",
      },
      { property: "og:title", content: "Business Processes — KTern.AI Test Management" },
      { property: "og:description", content: "Process hierarchy with WBS numbering, ownership and test coverage." },
    ],
  }),
  component: ProcessesPage,
});

function ProcessesPage() {
  const store = useStore();
  const [view, setView] = useState<"tree" | "grid">("grid");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ parentId: string | null } | null>(null);
  const [form, setForm] = useState({ name: "", levelType: "Process Step", application: "SAP ERP", owner: "u2" });
  const [filters, setFilters] = useState({ levelType: "", application: "", owner: "", source: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [columns, setColumns] = useState({ levelType: true, application: true, owner: true, coverage: true, source: true });
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const matchesFilters = (node: BusinessProcess) =>
    (!filters.levelType || node.levelType === filters.levelType) &&
    (!filters.application || node.application === filters.application) &&
    (!filters.owner || node.owner === filters.owner) &&
    (!filters.source || node.sourceType === filters.source);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, BusinessProcess[]>();
    store.processes.forEach((p) => {
      const list = map.get(p.parentId) ?? [];
      list.push(p);
      map.set(p.parentId, list);
    });
    return map;
  }, [store.processes]);

  const coverage = (id: string): { cases: number; passed: number } => {
    const descendants: string[] = [];
    const walk = (pid: string) => {
      descendants.push(pid);
      (childrenOf.get(pid) ?? []).forEach((c) => walk(c.id));
    };
    walk(id);
    const cases = store.cases.filter((c) => c.processIds.some((p) => descendants.includes(p)));
    const runs = store.runs.filter((r) => cases.some((c) => c.id === r.testCaseId));
    return { cases: cases.length, passed: runs.filter((r) => r.status === "Passed").length };
  };

  interface Row {
    node: BusinessProcess;
    depth: number;
    wbs: string;
  }
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const walk = (parentId: string | null, depth: number, prefix: string) => {
      (childrenOf.get(parentId) ?? []).forEach((node, i) => {
        const wbs = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        out.push({ node, depth, wbs });
        if (view === "grid" || !collapsed.has(node.id)) walk(node.id, depth + 1, wbs);
      });
    };
    walk(null, 0, "");
    return out;
  }, [childrenOf, collapsed, view]);

  const levelTypes = store.config.filter((c) => c.group === "Level Type" && c.active);
  const applications = store.config.filter((c) => c.group === "Application" && c.active);

  const submit = () => {
    if (!form.name.trim() || !creating) return;
    store.addProcess({ ...form, parentId: creating.parentId, sourceType: "Manual" });
    setForm({ ...form, name: "" });
    setCreating(null);
  };

  return (
    <AppShell breadcrumbs={["Business Processes", "Nortaxis Systems", "Organization master"]}>
      <PageHeader
        title="Business Processes"
        subtitle={`${store.processes.length} nodes · organization-level master content · reusable across every project`}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-full bg-muted p-1" aria-label="Process view">
              {(
                [
                  { id: "grid", label: "Grid", icon: Grid3X3 },
                  { id: "tree", label: "Tree", icon: ListTree },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setView(opt.id)}
                  className={
                    view === opt.id
                      ? "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-card px-4 text-[13px] font-medium text-foreground shadow-sm"
                      : "inline-flex min-h-8 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
            <Button onClick={() => setCreating({ parentId: selected })}>
              {selected ? "Add child node" : "Add root node"}
            </Button>
          </>
        }
      />

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ node, depth, wbs }) => {
            const kids = childrenOf.get(node.id) ?? [];
            const cov = coverage(node.id);
            const parent = node.parentId ? store.processes.find((process) => process.id === node.parentId) : null;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelected(node.id === selected ? null : node.id)}
                className={cn(
                  "group min-h-44 rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:border-ring hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected === node.id ? "border-ring ring-2 ring-ring/20" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-muted-foreground">WBS {wbs}</div>
                    <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{node.name}</h2>
                  </div>
                  <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-1 font-mono text-[9px] text-muted-foreground">
                    L{depth + 1}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[11px]">
                  <div>
                    <Caps>Level type</Caps>
                    <div className="mt-1 truncate text-foreground">{node.levelType}</div>
                  </div>
                  <div>
                    <Caps>Application</Caps>
                    <div className="mt-1 truncate font-mono text-[10px] text-foreground">{node.application}</div>
                  </div>
                  <div>
                    <Caps>Owner</Caps>
                    <div className="mt-1 truncate text-foreground">{userName(node.owner)}</div>
                  </div>
                  <div>
                    <Caps>Coverage</Caps>
                    <div className="mt-1 font-mono text-[10px] text-foreground">{cov.cases} cases · {cov.passed} pass</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-[9px] text-muted-foreground">
                  <span className="truncate pr-3">{parent ? `Under ${parent.name}` : "Root process"}</span>
                  <span className="shrink-0">{kids.length} children · {node.sourceType}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Panel className="overflow-x-auto p-0">
          <div className="grid min-w-[900px] grid-cols-[80px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_120px_80px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>WBS</span><span>NAME</span><span>LEVEL TYPE</span><span>APPLICATION</span><span>OWNER</span><span>COVERAGE</span><span className="text-right">SOURCE</span>
          </div>
          <div className="min-w-[900px] divide-y divide-border text-[12px]">
            {rows.map(({ node, depth, wbs }) => {
              const kids = childrenOf.get(node.id) ?? [];
              const cov = coverage(node.id);
              return (
                <div key={node.id} onClick={() => setSelected(node.id === selected ? null : node.id)} className={cn("grid cursor-pointer grid-cols-[80px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_120px_80px] items-center gap-2 px-4 py-2 hover:bg-muted/70", selected === node.id && "bg-muted")}>
                  <span className="font-mono text-[10px] text-muted-foreground">{wbs}</span>
                  <div className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: depth * 16 }}>
                    {kids.length ? (
                      <span onClick={(event) => event.stopPropagation()}>
                        <Button variant="ghost" className="size-6 min-h-6 shrink-0 px-0" onClick={() => { setCollapsed((previous) => { const next = new Set(previous); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }); }} aria-label={collapsed.has(node.id) ? `Expand ${node.name}` : `Collapse ${node.name}`}>
                          {collapsed.has(node.id) ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </Button>
                      </span>
                    ) : <span className="w-6" />}
                    <span className="truncate font-medium">{node.name}</span>
                  </div>
                  <span className="truncate text-muted-foreground">{node.levelType}</span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground">{node.application}</span>
                  <span className="truncate text-muted-foreground">{userName(node.owner)}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{cov.cases} cases · {cov.passed} pass</span>
                  <span className="text-right font-mono text-[10px] text-muted-foreground">{node.sourceType}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {selected ? (
        <Panel className="flex flex-wrap items-center gap-3 p-4">
          <Caps>Selected node</Caps>
          <span className="text-[12.5px] font-medium">
            {store.processes.find((p) => p.id === selected)?.name}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => setCreating({ parentId: selected })}>
              Add child
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.deleteProcess(selected);
                setSelected(null);
              }}
            >
              Delete node and children
            </Button>
          </div>
        </Panel>
      ) : null}

      <Modal
        title={creating?.parentId ? "New child process" : "New root process"}
        open={!!creating}
        onClose={() => setCreating(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(null)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create node</Button>
          </>
        }
      >
        <Field label="Name">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Invoice verification" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level type">
            <Select value={form.levelType} onChange={(e) => setForm({ ...form, levelType: e.target.value })}>
              {levelTypes.map((l) => (
                <option key={l.id}>{l.value}</option>
              ))}
            </Select>
          </Field>
          <Field label="Application">
            <Select value={form.application} onChange={(e) => setForm({ ...form, application: e.target.value })}>
              {applications.map((l) => (
                <option key={l.id}>{l.value}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Owner">
          <Select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>
    </AppShell>
  );
}
