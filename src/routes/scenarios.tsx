import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Caps, Field, Modal, PageHeader, Panel, TextArea, TextInput } from "@/components/ui-kit";
import { useStore, userName } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Test Scenarios — KTern.AI Test Management" },
      {
        name: "description",
        content: "Reusable end-to-end scenarios that sequence master test cases into integration flows for any project.",
      },
      { property: "og:title", content: "Test Scenarios — KTern.AI Test Management" },
      { property: "og:description", content: "Sequenced end-to-end flows built from reusable master test cases." },
    ],
  }),
  component: ScenariosPage,
});

function ScenariosPage() {
  const store = useStore();
  const [selected, setSelected] = useState<string | null>(store.scenarios[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const active = store.scenarios.find((s) => s.id === selected);
  const members = active
    ? [...active.members].sort((a, b) => a.sequence - b.sequence).map((m) => ({
        ...m,
        testCase: store.cases.find((c) => c.id === m.testCaseId)!,
      }))
    : [];

  const move = (index: number, delta: number) => {
    if (!active) return;
    const ids = members.map((m) => m.testCaseId);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const a = ids[index]!;
    ids[index] = ids[target]!;
    ids[target] = a;
    store.setScenarioMembers(active.id, ids);
  };

  return (
    <AppShell breadcrumbs={["Scenarios", "Nortaxis Systems", "Organization master"]}>
      <PageHeader
        title="Test Scenarios"
        subtitle={`${store.scenarios.length} reusable end-to-end flows · pulled into plans as a bulk selection shortcut`}
        actions={<Button onClick={() => setCreating(true)}>New scenario</Button>}
      />

      <div className="grid grid-cols-12 gap-3">
        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-4">
          <div className="border-b border-border px-4 py-2.5">
            <Caps>Scenarios</Caps>
          </div>
          <div className="divide-y divide-border text-[12px]">
            {store.scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={cn(
                  "block w-full px-4 py-3 text-left hover:bg-muted/70",
                  selected === s.id && "bg-muted",
                )}
              >
                <div className="font-medium">{s.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {s.key} · {s.members.length} cases · {userName(s.owner)}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-12 overflow-hidden p-0 lg:col-span-8">
          {active ? (
            <div>
              <div className="flex items-start justify-between border-b border-border px-4 py-3">
                <div>
                  <Caps>Scenario · {active.key}</Caps>
                  <div className="font-display text-[15px] leading-tight font-semibold">{active.name}</div>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{active.description}</p>
                </div>
                <Button variant="ghost" onClick={() => setAdding(true)}>
                  Add test cases
                </Button>
              </div>
              <div className="divide-y divide-border text-[12px]">
                {members.map((m, i) => (
                  <div key={m.testCaseId} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px]">
                      {m.sequence}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{m.testCase?.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {m.testCase?.key} · v{m.testCase?.versions.length} · {m.testCase?.testingType}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => move(i, -1)} className="rounded px-1.5 text-muted-foreground hover:bg-muted">
                        ↑
                      </button>
                      <button onClick={() => move(i, 1)} className="rounded px-1.5 text-muted-foreground hover:bg-muted">
                        ↓
                      </button>
                      <button
                        onClick={() =>
                          store.setScenarioMembers(
                            active.id,
                            members.filter((x) => x.testCaseId !== m.testCaseId).map((x) => x.testCaseId),
                          )
                        }
                        className="rounded px-1.5 text-fail hover:bg-fail/10"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {members.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">
                    No test cases in this scenario yet
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-[12px] text-muted-foreground">Select a scenario</div>
          )}
        </Panel>
      </div>

      <Modal title="Add test cases" open={adding} wide onClose={() => setAdding(false)}>
        <div className="max-h-[420px] space-y-1 overflow-y-auto">
          {store.cases.map((c) => {
            const inScenario = active?.members.some((m) => m.testCaseId === c.id);
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (!active) return;
                  const ids = members.map((m) => m.testCaseId);
                  store.setScenarioMembers(
                    active.id,
                    inScenario ? ids.filter((id) => id !== c.id) : [...ids, c.id],
                  );
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[12px] ring-1",
                  inScenario ? "bg-accent/10 ring-accent/30" : "bg-card ring-line",
                )}
              >
                <span className="truncate">{c.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{c.key}</span>
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        title="New scenario"
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
                store.addScenario(form);
                setForm({ name: "", description: "" });
                setCreating(false);
              }}
            >
              Create scenario
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
      </Modal>
    </AppShell>
  );
}
