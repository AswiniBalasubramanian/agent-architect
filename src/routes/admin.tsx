import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Caps, PageHeader, Panel, Select, TextInput } from "@/components/ui-kit";
import { useStore, userName, users } from "@/store/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — KTern.AI Test Management" },
      {
        name: "description",
        content: "Configure dropdown values, custom fields, severity SLA rules and notification triggers for the whole organization.",
      },
      { property: "og:title", content: "Admin Console — KTern.AI Test Management" },
      { property: "og:description", content: "One console for configuration values, custom fields, SLA rules and notifications." },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Configuration values", "Custom fields", "SLA rules", "Notifications", "Users & roles"] as const;

function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Configuration values");
  const [group, setGroup] = useState("Environment");
  const [newValue, setNewValue] = useState("");

  const groups = [...new Set(store.config.map((c) => c.group))];

  return (
    <AppShell breadcrumbs={["Admin", "Nortaxis Systems", tab]}>
      <PageHeader
        title="Admin Console"
        subtitle="Organization-level configuration. Changes apply immediately to every project in this organization."
      />

      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12px]",
              tab === t ? "bg-ink text-paper" : "bg-white/70 text-muted-foreground ring-1 ring-line hover:bg-white",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Configuration values" ? (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-3">
            <div>
              <Caps>Group</Caps>
              <Select className="mt-1 w-56" value={group} onChange={(e) => setGroup(e.target.value)}>
                {groups.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <Caps>Add value</Caps>
              <TextInput
                className="mt-1"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`New ${group.toLowerCase()} value`}
              />
            </div>
            <Button
              onClick={() => {
                if (!newValue.trim()) return;
                store.addConfigValue(group, newValue.trim());
                setNewValue("");
              }}
            >
              Add
            </Button>
          </div>
          <div className="divide-y divide-line/70 text-[12px]">
            {store.config
              .filter((c) => c.group === group)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className={cn(!c.active && "text-muted-foreground line-through")}>{c.value}</span>
                  <button
                    onClick={() => store.toggleConfigValue(c.id)}
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[10px] ring-1",
                      c.active ? "bg-pass/10 text-pass ring-pass/30" : "bg-muted text-muted-foreground ring-line",
                    )}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </div>
              ))}
          </div>
        </Panel>
      ) : null}

      {tab === "Custom fields" ? (
        <Panel className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_110px_110px_90px_100px] gap-2 border-b border-line px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>FIELD</span>
            <span>ENTITY</span>
            <span>TYPE</span>
            <span>REQUIRED</span>
            <span className="text-right">STATE</span>
          </div>
          <div className="divide-y divide-line/70 text-[12px]">
            {store.customFields.map((f) => (
              <div key={f.id} className="grid grid-cols-[minmax(0,1.5fr)_110px_110px_90px_100px] items-center gap-2 px-4 py-2.5">
                <span className="font-medium">{f.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{f.entity}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{f.type}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{f.required ? "Yes" : "No"}</span>
                <button
                  onClick={() => store.toggleCustomField(f.id)}
                  className={cn(
                    "justify-self-end rounded-md px-2 py-0.5 font-mono text-[10px] ring-1",
                    f.active ? "bg-pass/10 text-pass ring-pass/30" : "bg-muted text-muted-foreground ring-line",
                  )}
                >
                  {f.active ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === "SLA rules" ? (
        <Panel className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_90px_120px_130px_100px] gap-2 border-b border-line px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>RULE</span>
            <span>SEVERITY</span>
            <span>RESPONSE</span>
            <span>RESOLUTION</span>
            <span className="text-right">STATE</span>
          </div>
          <div className="divide-y divide-line/70 text-[12px]">
            {store.slaRules.map((r) => (
              <div key={r.id} className="grid grid-cols-[minmax(0,1.5fr)_90px_120px_130px_100px] items-center gap-2 px-4 py-2.5">
                <span className="font-medium">{r.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{r.severity}</span>
                <span className="font-mono text-[11px]">{r.responseHours}h</span>
                <span className="font-mono text-[11px]">{r.resolutionHours}h</span>
                <button
                  onClick={() => store.toggleSlaRule(r.id)}
                  className={cn(
                    "justify-self-end rounded-md px-2 py-0.5 font-mono text-[10px] ring-1",
                    r.active ? "bg-pass/10 text-pass ring-pass/30" : "bg-muted text-muted-foreground ring-line",
                  )}
                >
                  {r.active ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === "Notifications" ? (
        <Panel className="overflow-hidden p-0">
          <div className="divide-y divide-line/70 text-[12px]">
            {store.notificationRules.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium">{n.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {n.event} → {n.recipients} · {n.channel}
                  </div>
                </div>
                <button
                  onClick={() => store.toggleNotificationRule(n.id)}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-mono text-[10px] ring-1",
                    n.active ? "bg-pass/10 text-pass ring-pass/30" : "bg-muted text-muted-foreground ring-line",
                  )}
                >
                  {n.active ? "On" : "Off"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === "Users & roles" ? (
        <Panel className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_130px_100px] gap-2 border-b border-line px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>NAME</span>
            <span>EMAIL</span>
            <span>ROLE</span>
            <span className="text-right">RUNS</span>
          </div>
          <div className="divide-y divide-line/70 text-[12px]">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_130px_100px] items-center gap-2 px-4 py-2.5">
                <span className="font-medium">{userName(u.id)}</span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">{u.email}</span>
                <span className="font-mono text-[10px]">{u.role}</span>
                <span className="text-right font-mono text-[11px] text-muted-foreground">
                  {store.runs.filter((r) => r.assignee === u.id).length}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </AppShell>
  );
}
