import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { currentUser, organizations, projects, useStore } from "@/store/app-store";
import { slaState } from "@/lib/sla";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", code: "01" },
  { to: "/processes", label: "Business Processes", code: "02" },
  { to: "/requirements", label: "Requirements", code: "03" },
  { to: "/test-cases", label: "Test Cases", code: "04" },
  { to: "/scenarios", label: "Scenarios", code: "05" },
  { to: "/plans", label: "Test Plans", code: "06" },
  { to: "/runs", label: "Test Runs", code: "07" },
  { to: "/defects", label: "Defects", code: "08" },
  { to: "/admin", label: "Admin", code: "09" },
] as const;

export function AppShell({
  breadcrumbs,
  children,
}: {
  breadcrumbs: string[];
  children: ReactNode;
}) {
  const store = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const project = projects.find((p) => p.id === store.activeProjectId) ?? projects[0];
  const org = organizations.find((o) => o.id === project.orgId)!;
  const slaOpen = store.defects.filter((d) => {
    const s = slaState(d, store.slaRules);
    return !s.closed && (s.breached || s.atRisk);
  }).length;

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white/55 backdrop-blur-xl lg:flex">
          <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
            <div className="grid size-7 place-items-center rounded-md bg-ink font-display text-sm font-bold text-paper">K</div>
            <div className="leading-tight">
              <div className="font-display text-[13px] font-semibold">KTern.AI</div>
              <div className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">TEST OPS</div>
            </div>
          </div>

          <div className="relative px-3 py-3">
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-lg bg-white/70 px-2.5 py-2 text-left ring-1 ring-line"
            >
              <div className="grid size-6 place-items-center rounded-md bg-accent/15 font-display text-xs font-semibold text-accent">
                {org.name[0]}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold">{org.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {project.kind} · {project.phase}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">▾</span>
            </button>
            {switcherOpen ? (
              <div className="absolute inset-x-3 top-[58px] z-20 rounded-lg bg-popover p-1 shadow-lg ring-1 ring-line">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      store.setActiveProject(p.id);
                      setSwitcherOpen(false);
                    }}
                    className={cn(
                      "block w-full rounded-md px-2.5 py-1.5 text-left text-[12px] hover:bg-muted",
                      p.id === project.id ? "font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {p.name}
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {organizations.find((o) => o.id === p.orgId)?.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <nav className="space-y-px px-3 pb-4 text-[12.5px] font-medium">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2",
                    active ? "bg-ink text-paper" : "text-muted-foreground hover:bg-white/70",
                  )}
                >
                  {item.label}
                  {item.label === "Defects" && slaOpen > 0 ? (
                    <span className="rounded bg-fail/10 px-1 font-mono text-[10px] text-fail">{slaOpen} SLA</span>
                  ) : (
                    <span className="font-mono text-[10px] opacity-70">{item.code}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-line px-4 py-3">
            <div className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">SIGNED IN</div>
            <div className="mt-1 text-[12px] font-semibold">{currentUser.name}</div>
            <div className="text-[10px] text-muted-foreground">{currentUser.role}</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-line bg-paper/70 px-5 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-1.5 font-mono text-[12px] text-muted-foreground">
              {breadcrumbs.map((b, i) => (
                <span key={b} className={cn("truncate", i === 0 && "font-semibold text-ink")}>
                  {i > 0 ? <span className="mr-1.5">›</span> : null}
                  {b}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden w-52 items-center gap-2 rounded-md bg-white/70 px-2.5 py-1.5 text-[12px] text-muted-foreground ring-1 ring-line md:flex">
                <span className="text-[10px]">⌕</span> {project.key ?? "Search runs, cases, owners…"}
              </div>
              <div className="grid size-8 place-items-center rounded-md bg-accent/15 font-display text-xs font-semibold text-accent">
                {currentUser.initials}
              </div>
            </div>
          </header>
          <main className="space-y-4 p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
