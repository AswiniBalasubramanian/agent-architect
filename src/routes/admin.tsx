import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button, Caps, NoAccess, PageHeader, Panel, Select, Spinner, TextInput } from "@/components/ui-kit";
import { organizations, projects, useStore, userName, users } from "@/store/app-store";
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

const TABS = ["Configuration values", "Custom fields", "SLA rules", "Notifications", "Integrations", "Users & roles"] as const;

function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Configuration values");
  const [group, setGroup] = useState("Environment");
  const [newValue, setNewValue] = useState("");

  const groups = [...new Set(store.config.map((c) => c.group))];
  const project = projects.find((p) => p.id === store.activeProjectId)!;
  const org = organizations.find((o) => o.id === project.orgId)!;

  if (!store.can("administer")) {
    return (
      <AppShell breadcrumbs={[org.name, "Administration"]}>
        <PageHeader title="Admin Console" subtitle="Organization-level configuration." />
        <NoAccess what="Only the Admin persona can change configuration values, custom fields, SLA rules, notifications and integrations. Switch persona in the top bar to continue." />
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumbs={[org.name, "Administration", tab]}>
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
              tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Configuration values" ? (
        <Panel className="overflow-x-auto p-0">
          <div className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3">
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
          <div className="divide-y divide-border text-[12px]">
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
        <Panel className="overflow-x-auto p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_110px_110px_90px_100px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>FIELD</span>
            <span>ENTITY</span>
            <span>TYPE</span>
            <span>REQUIRED</span>
            <span className="text-right">STATE</span>
          </div>
          <div className="divide-y divide-border text-[12px]">
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
        <Panel className="overflow-x-auto p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_90px_120px_130px_100px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>RULE</span>
            <span>APPLIES TO</span>
            <span>RESPONSE</span>
            <span>RESOLUTION</span>
            <span className="text-right">STATE</span>
          </div>
          <div className="divide-y divide-border text-[12px]">
            {store.slaRules.map((r) => (
              <div key={r.id} className="grid grid-cols-[minmax(0,1.5fr)_90px_120px_130px_100px] items-center gap-2 px-4 py-2.5">
                <span className="font-medium">{r.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{r.appliesTo}</span>
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
        <Panel className="overflow-x-auto p-0">
          <div className="divide-y divide-border text-[12px]">
            {store.notificationRules.map((n) => (
              <div key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium">{n.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {n.trigger} → {n.recipients} · {n.cadence}
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

      {tab === "Integrations" ? (
        <Panel className="overflow-x-auto p-0">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_130px_150px_180px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>SOURCE</span>
            <span>SCOPE</span>
            <span>DIRECTION</span>
            <span>STATE</span>
            <span className="text-right">ACTIONS</span>
          </div>
          <div className="divide-y divide-border text-[12px]">
            {store.integrations.map((integration) => {
              const syncing = store.syncingIntegrationId === integration.id;
              const connected = integration.status === "Connected";
              return (
                <div
                  key={integration.id}
                  className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.6fr)_130px_150px_180px] items-center gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {integration.name} <span className="text-muted-foreground">· {integration.vendor}</span>
                    </div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {integration.entities.join(" · ")}
                    </div>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">{integration.purpose}</div>
                  <span className="font-mono text-[10px] text-muted-foreground">{integration.direction}</span>
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border border-current/15 px-2 py-0.5 text-[10px] font-medium",
                        integration.status === "Connected"
                          ? "bg-pass/12 text-pass"
                          : integration.status === "Error"
                            ? "bg-fail/12 text-fail"
                            : "bg-pending/20 text-muted-foreground",
                      )}
                    >
                      {syncing ? <Spinner /> : <i className="size-1.5 rounded-full bg-current" />}
                      {syncing ? "Syncing…" : integration.status}
                    </span>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {integration.lastSync
                        ? `${integration.recordCount ?? 0} records · ${integration.lastSync.slice(0, 16).replace("T", " ")}`
                        : "never synced"}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="border border-border" onClick={() => store.toggleIntegration(integration.id)}>
                      {connected ? "Disconnect" : "Connect"}
                    </Button>
                    <Button disabled={syncing || !connected} onClick={() => void store.syncIntegration(integration.id)}>
                      {syncing ? <Spinner /> : null}
                      {syncing ? "Syncing" : "Sync now"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}

      {tab === "Users & roles" ? (
        <Panel className="overflow-x-auto p-0">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_130px_100px] gap-2 border-b border-border px-4 py-2 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
            <span>NAME</span>
            <span>INITIALS</span>
            <span>ROLE</span>
            <span className="text-right">RUNS</span>
          </div>
          <div className="divide-y divide-border text-[12px]">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_130px_100px] items-center gap-2 px-4 py-2.5">
                <span className="font-medium">{userName(u.id)}</span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">{u.initials}</span>
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
