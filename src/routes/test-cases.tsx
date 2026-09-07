import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { organizations, projects, useStore, userName } from "@/store/app-store";
import { CardsSkeleton, TableSkeleton } from "@/components/ui-kit";
import { AiAssist } from "@/components/ai-assist";
import { BulkImportTestCases } from "@/components/bulk-import";
import { draftSteps } from "@/lib/ai";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import type { Priority, TestStep } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/test-cases")({
  head: () => ({
    meta: [
      { title: "Test Case Repository — KTern.AI Test Management" },
      {
        name: "description",
        content:
          "Reusable master test cases with immutable version history, ordered steps and folder-based organization across every project.",
      },
      { property: "og:title", content: "Test Case Repository — KTern.AI Test Management" },
      { property: "og:description", content: "Master test cases with immutable version snapshots and full step detail." },
    ],
  }),
  component: TestCasesPage,
});

function TestCasesPage() {
  const store = useStore();
  const [folder, setFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(store.cases[0]?.id ?? null);
  const [viewVersion, setViewVersion] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [moveTo, setMoveTo] = useState("f2");
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TestStep[]>([]);
  const [changeNote, setChangeNote] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    folderId: "f2",
    testingType: "Regression",
    priority: "Medium" as Priority,
  });

  const descendants = useMemo(() => {
    const map = (id: string): string[] => [
      id,
      ...store.folders.filter((f) => f.parentId === id).flatMap((f) => map(f.id)),
    ];
    return map;
  }, [store.folders]);

  const cases = store.cases.filter(
    (c) =>
      (!folder || descendants(folder).includes(c.folderId)) &&
      (query === "" || `${c.key} ${c.name}`.toLowerCase().includes(query.toLowerCase())),
  );
  const active = store.cases.find((c) => c.id === selected);
  const version = active
    ? (active.versions.find((v) => v.version === viewVersion) ?? active.versions[active.versions.length - 1])
    : undefined;
  const isLatest = !!active && !!version && version.version === active.versions.length;
  const runsForCase = active ? store.runs.filter((r) => r.testCaseId === active.id) : [];

  const startEdit = () => {
    if (!active) return;
    setDraft(active.versions[active.versions.length - 1]!.steps.map((s) => ({ ...s })));
    setChangeNote("");
    setEditing(true);
  };

  const ready = useSimulatedLoad(`${store.activeProjectId}:${store.personaId}`);
  const project = projects.find((p) => p.id === store.activeProjectId)!;
  const org = organizations.find((o) => o.id === project.orgId)!;
  const canEdit = store.can("authorMaster");

  if (!ready) {
    return (
      <AppShell breadcrumbs={[org.name, project.name, "Test Case Repository"]}>
        <PageHeader title="Test Case Repository" subtitle="Loading this workspace…" />
        <CardsSkeleton />
        <TableSkeleton rows={8} />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[org.name, project.name, "Test Case Repository"]}>
      <BulkImportTestCases open={importing} onClose={() => setImporting(false)} />
      <PageHeader
        title="Test Case Repository"
        subtitle={`${store.cases.length} master cases · every save creates an immutable version · reusable across all projects`}
        actions={
          <>
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases…" className="w-52" />
            {canEdit ? (
              <Button variant="ghost" onClick={() => setImporting(true)}>
                Bulk import
              </Button>
            ) : null}
            {canEdit ? <Button onClick={() => setCreating(true)}>New test case</Button> : null}
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 p-3 lg:col-span-2">
          <Caps className="mb-2 px-1">Folders</Caps>
          <button
            onClick={() => setFolder(null)}
            className={cn(
              "block w-full rounded-md px-2 py-1.5 text-left text-[12px]",
              folder === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/70",
            )}
          >
            All test cases
          </button>
          {store.folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setFolder(f.id)}
              onDragOver={(e) => {
                if (canEdit) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!canEdit) return;
                const dropped = e.dataTransfer.getData("text/plain");
                const ids = checked.length && dropped && checked.includes(dropped) ? checked : dropped ? [dropped] : [];
                if (ids.length) {
                  store.moveCasesToFolder(ids, f.id);
                  setChecked([]);
                }
              }}
              style={{ paddingLeft: f.parentId ? 22 : 8 }}
              className={cn(
                "block w-full rounded-md py-1.5 pr-2 text-left text-[12px]",
                folder === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              {f.name}
              <span className="ml-1.5 font-mono text-[10px] opacity-60">
                {store.cases.filter((c) => c.folderId === f.id).length}
              </span>
            </button>
          ))}
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-5">
          <div className="grid grid-cols-[minmax(0,2fr)_90px_70px_60px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>CASE</span>
            <span>TYPE</span>
            <span>PRIORITY</span>
            <span className="text-right">VER</span>
          </div>
          <div className="max-h-[560px] divide-y divide-border overflow-y-auto text-[12px]">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c.id);
                  setViewVersion(null);
                  setEditing(false);
                }}
                className={cn(
                  "grid w-full grid-cols-[minmax(0,2fr)_90px_70px_60px] items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/70",
                  selected === c.id && "bg-muted",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {c.key} · {userName(c.owner)}
                  </div>
                </div>
                <span className="truncate font-mono text-[10px] text-muted-foreground">{c.testingType}</span>
                <PriorityTag priority={c.priority} />
                <span className="text-right font-mono text-[10px] text-muted-foreground">v{c.versions.length}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-5">
          {active && version ? (
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <Caps>Case detail · {active.key}</Caps>
                  <div className="font-display text-[15px] leading-tight font-semibold">{active.name}</div>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{active.description}</p>
                </div>
                {canEdit ? (
                  <Button variant="ghost" onClick={startEdit}>
                    Edit steps
                  </Button>
                ) : null}
              </div>

              {store.can("useAi") && canEdit ? (
                <div className="border-b border-border p-3">
                  <AiAssist
                    className="shadow-none"
                    title="Draft steps"
                    hint="Writes an ordered step set for this case; review it, then save as a new version."
                    cta="Draft steps"
                    produce={() => draftSteps(active.name, active.application, active.testingType)}
                    acceptLabel="Open in step editor"
                    onAccept={(steps) => {
                      setDraft(
                        steps.map((st, i) => ({
                          id: `ai-${i}-${st.title.toLowerCase().replace(/\W+/g, "-")}`,
                          stepNo: i + 1,
                          title: st.title,
                          instruction: st.instruction,
                          action: st.action,
                          expected: st.expected,
                        })),
                      );
                      setChangeNote("Steps drafted with the assistant");
                      setEditing(true);
                    }}
                    render={(steps) => (
                      <ol className="list-decimal space-y-1.5 pl-4">
                        {steps.map((st) => (
                          <li key={st.title}>
                            <b>{st.title}</b> — {st.instruction} <span className="text-muted-foreground">Expected: {st.expected}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-4 gap-3 border-b border-border px-4 py-3 text-[11px]">
                <div>
                  <Caps>Owner</Caps>
                  <div className="mt-0.5 font-semibold">{userName(active.owner)}</div>
                </div>
                <div>
                  <Caps>Type</Caps>
                  <div className="mt-0.5 font-mono">{active.testingType}</div>
                </div>
                <div>
                  <Caps>Application</Caps>
                  <div className="mt-0.5 font-mono">{active.application}</div>
                </div>
                <div>
                  <Caps>Runs</Caps>
                  <div className="mt-0.5 font-mono">{runsForCase.length}</div>
                </div>
              </div>

              {!isLatest ? (
                <div className="border-b border-border bg-warn/10 px-4 py-2 font-mono text-[11px] text-warn">
                  Viewing v{version.version} — this is not the latest version (v{active.versions.length}).
                </div>
              ) : null}

              <div className="border-b border-border px-4 py-3">
                <Caps className="mb-2">Steps · v{version.version}</Caps>
                <ol className="space-y-2 text-[12px]">
                  {version.steps.map((s) => (
                    <li key={s.id} className="rounded-md bg-card p-2.5 border border-border">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{s.stepNo}</span>
                        <span className="font-semibold">{s.title}</span>
                        {s.action ? (
                          <span className="ml-auto rounded bg-muted px-1.5 font-mono text-[9px] text-muted-foreground">
                            {s.action}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-muted-foreground">{s.instruction}</div>
                      <div className="mt-1 text-[11px]">
                        <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">EXPECTED · </span>
                        {s.expected}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="px-4 py-3">
                <Caps className="mb-2">Version history</Caps>
                <div className="space-y-2 text-[12px]">
                  {[...active.versions].reverse().map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setViewVersion(v.version)}
                      className="flex w-full items-start gap-2.5 text-left"
                    >
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          v.version === version.version ? "bg-accent" : "bg-line",
                        )}
                      />
                      <div>
                        <div className={cn("font-medium", v.version !== version.version && "text-muted-foreground")}>
                          v{v.version}
                          {v.version === active.versions.length ? (
                            <span className="ml-1 font-mono text-[10px] text-muted-foreground">· current</span>
                          ) : null}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {userName(v.createdBy)} · {v.createdOn.slice(0, 10)} · {v.changeNote}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">Select a test case</div>
          )}
        </Panel>
      </div>

      <Modal
        title={`Edit steps — ${active?.key ?? ""}`}
        open={editing}
        wide
        onClose={() => setEditing(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!active) return;
                store.saveTestCaseVersion(active.id, draft, changeNote);
                setEditing(false);
                setViewVersion(null);
              }}
            >
              Save as new version
            </Button>
          </>
        }
      >
        <p className="text-[11.5px] text-muted-foreground">
          Saving creates an immutable version snapshot. Existing runs stay pinned to the version they executed.
        </p>
        <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
          {draft.map((s, i) => (
            <div key={s.id} className="rounded-md bg-card p-2.5 border border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                <TextInput
                  value={s.title}
                  onChange={(e) => setDraft(draft.map((d, j) => (j === i ? { ...d, title: e.target.value } : d)))}
                />
                <button
                  onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                  className="px-1 text-[12px] text-fail"
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
              <TextArea
                className="mt-2"
                value={s.instruction}
                onChange={(e) => setDraft(draft.map((d, j) => (j === i ? { ...d, instruction: e.target.value } : d)))}
              />
              <TextInput
                className="mt-2"
                value={s.expected}
                onChange={(e) => setDraft(draft.map((d, j) => (j === i ? { ...d, expected: e.target.value } : d)))}
              />
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            setDraft([
              ...draft,
              {
                id: `new-${draft.length}-${Math.random().toString(36).slice(2, 6)}`,
                stepNo: draft.length + 1,
                title: "New step",
                instruction: "",
                expected: "",
              },
            ])
          }
        >
          + Add step
        </Button>
        <Field label="Change note">
          <TextInput value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="What changed and why" />
        </Field>
      </Modal>

      <Modal
        title="New test case"
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
                store.addTestCase(form);
                setForm({ ...form, name: "", description: "" });
                setCreating(false);
              }}
            >
              Create case
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
          <Field label="Folder">
            <Select value={form.folderId} onChange={(e) => setForm({ ...form, folderId: e.target.value })}>
              {store.folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Testing type">
            <Select value={form.testingType} onChange={(e) => setForm({ ...form, testingType: e.target.value })}>
              {store.config
                .filter((c) => c.group === "Testing Type" && c.active)
                .map((c) => (
                  <option key={c.id}>{c.value}</option>
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
        </div>
      </Modal>
    </AppShell>
  );
}
