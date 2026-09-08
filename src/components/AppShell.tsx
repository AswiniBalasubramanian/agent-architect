import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bug,
  Check,
  CheckSquare2,
  ChevronDown,
  ClipboardCheck,
  PanelLeft,
  PanelRight,
  FileCheck2,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Menu,
  Network,
  Search,
  UserCog,
  Settings2,
  TestTube2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { Button } from "@/components/ui-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { organizations, projects, useStore } from "@/store/app-store";
import { personas } from "@/data/personas";
import { slaState } from "@/lib/sla";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: LucideIcon };

const navGroups: { heading: string; scope: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    scope: "",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Organization library",
    scope: "Shared across projects",
    items: [
      { to: "/processes", label: "Business Processes", icon: Network },
      { to: "/requirements", label: "Requirements", icon: FileCheck2 },
      { to: "/test-cases", label: "Test Cases", icon: CheckSquare2 },
      { to: "/scenarios", label: "Scenarios", icon: FolderKanban },
    ],
  },
  {
    heading: "Project execution",
    scope: "Scoped to this project",
    items: [
      { to: "/plans", label: "Test Plans", icon: ClipboardCheck },
      { to: "/runs", label: "Test Runs", icon: TestTube2 },
      { to: "/defects", label: "Defects", icon: Bug },
    ],
  },
  {
    heading: "Reporting",
    scope: "Project rollups",
    items: [
      { to: "/insights", label: "Insights", icon: Lightbulb },
      { to: "/reports", label: "Reports", icon: LineChart },
    ],
  },
  {
    heading: "Administration",
    scope: "Organization settings",
    items: [{ to: "/admin", label: "Administration", icon: Settings2 }],
  },
];


export function AppShell({
  breadcrumbs,
  children,
}: {
  breadcrumbs: string[];
  children: ReactNode;
}) {
  const store = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const me = store.me;
  const persona = personas.find((p) => p.id === store.personaId) ?? personas[0]!;
  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => persona.routes.includes(i.to)) }))
    .filter((g) => g.items.length > 0);

  const project = projects.find((p) => p.id === store.activeProjectId) ?? projects[0];
  if (!project) return null;
  const org = organizations.find((o) => o.id === project.orgId);
  if (!org) return null;

  const slaOpen = store.defects.filter((d) => {
    const state = slaState(d, store.slaRules, new Date("2026-09-07T14:32:00Z").getTime());
    return !state.closed && (state.breached || state.atRisk);
  }).length;

  const sidebar = (mobile = false) => (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <div className={cn("flex h-14 items-center border-b border-border", collapsed && !mobile ? "justify-center px-2" : "gap-2.5 px-3")}>
        <img src="/favicon.svg" alt="KTern.AI" className="size-8 shrink-0" />
        {collapsed && !mobile ? null : (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold">KTern.AI</div>
            <div className="text-[10px] text-muted-foreground">Test management</div>
          </div>
        )}
        {mobile ? (
          <Button variant="ghost" className="size-8 px-0" onClick={() => setMobileOpen(false)}>
            <X className="size-4" />
            <span className="sr-only">Close navigation</span>
          </Button>
        ) : null}
      </div>

      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              title={collapsed && !mobile ? `${org.name} — ${project.name}` : undefined}
              className={cn(
                "flex w-full items-center rounded-md border border-border bg-background text-left shadow-sm hover:bg-muted",
                collapsed && !mobile ? "justify-center p-1.5" : "gap-2.5 px-2.5 py-2",
              )}
            >
              <div className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-foreground">
                {org.name[0]}
              </div>
              {collapsed && !mobile ? null : (
                <>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-xs font-medium">{org.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{project.name}</div>
                  </div>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side={collapsed && !mobile ? "right" : "bottom"}
            sideOffset={6}
            className="w-56 rounded-xl"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            {organizations.map((organization, orgIndex) => {
              const orgProjects = projects.filter((item) => item.orgId === organization.id);
              if (orgProjects.length === 0) return null;
              return (
                <Fragment key={organization.id}>
                  {orgIndex > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {organization.name}
                    </DropdownMenuLabel>
                    {orgProjects.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onSelect={() => store.setActiveProject(item.id)}
                        className="gap-2"
                      >
                        <Check className={cn("size-3.5 shrink-0", item.id === project.id ? "text-foreground" : "text-transparent")} />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="truncate text-[13px]">{item.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{item.id.toUpperCase()}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.heading} className={cn(groupIndex > 0 && (collapsed && !mobile ? "mt-3 border-t border-border pt-3" : "mt-4"))}>
            {collapsed && !mobile ? null : (
              <div className="px-3 pb-1.5 text-[11px] font-medium text-muted-foreground">{group.heading}</div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed && !mobile ? item.label : undefined}
                    className={cn(
                      "flex h-9 items-center rounded-lg text-[13px]",
                      collapsed && !mobile ? "justify-center px-2" : "gap-2.5 px-3",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
                    {collapsed && !mobile ? null : <span className="truncate">{item.label}</span>}
                    {item.to === "/defects" && slaOpen > 0 && (!collapsed || mobile) ? (
                      <span className="ml-auto rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">{slaOpen}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-border p-2", collapsed && !mobile ? "flex justify-center" : "flex items-center gap-2.5")}>
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">{me.initials}</div>
        {collapsed && !mobile ? null : (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-medium">{me.name}</div>
            <div className="truncate text-[10px] text-muted-foreground">{persona.label}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="relative h-full w-72 border-r border-border shadow-xl">{sidebar(true)}</aside>
        </div>
      ) : null}

      <div className="flex">
        <aside className={cn("sticky top-0 hidden h-screen shrink-0 border-r border-border lg:block", collapsed ? "w-16" : "w-60")}>
          {sidebar()}
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-5">
            <Button variant="ghost" className="size-8 px-0 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-4" />
              <span className="sr-only">Open navigation</span>
            </Button>
            <Button variant="ghost" className="hidden size-8 px-0 lg:inline-flex" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? <PanelRight className="size-4" /> : <PanelLeft className="size-4" />}
              <span className="sr-only">{collapsed ? "Expand navigation" : "Collapse navigation"}</span>
            </Button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb}-${index}`} className={cn("truncate", index === breadcrumbs.length - 1 && "font-medium text-foreground")}>
                  {index > 0 ? <span className="mr-1.5 text-border">/</span> : null}
                  {crumb}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden h-8 w-56 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground shadow-sm md:flex">
                <Search className="size-3.5" />
                <span>Search workspace…</span>
                <span className="ml-auto rounded border border-border bg-muted px-1 py-0.5 font-mono text-[9px]">⌘K</span>
              </div>
              {slaOpen > 0 ? (
                <div className="hidden items-center gap-1.5 text-xs text-destructive xl:flex">
                  <AlertTriangle className="size-3.5" />
                  {slaOpen} SLA risks
                </div>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex h-8 items-center gap-2 rounded-md border border-input bg-background pl-2 pr-2.5 text-xs shadow-sm hover:bg-muted"
                    aria-label="Switch persona"
                  >
                    <UserCog className="size-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">{persona.short}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={6} className="w-72 rounded-xl">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">View the workspace as</DropdownMenuLabel>
                  {personas.map((item) => (
                    <DropdownMenuItem key={item.id} onSelect={() => store.setPersona(item.id)} className="items-start gap-2">
                      <Check className={cn("mt-0.5 size-3.5 shrink-0", item.id === persona.id ? "text-foreground" : "text-transparent")} />
                      <div className="min-w-0 leading-tight">
                        <div className="text-[13px]">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground">{item.summary}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{me.initials}</div>
            </div>
          </header>
          <main className="space-y-4 p-3 sm:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}