import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  businessProcesses as seedProcesses,
  configValues as seedConfig,
  currentUser,
  customFields as seedCustomFields,
  defects as seedDefects,
  notificationRules as seedNotificationRules,
  organizations,
  projects,
  requirements as seedRequirements,
  slaRules as seedSlaRules,
  testCaseFolders as seedFolders,
  testCases as seedCases,
  testPlanFolders as seedPlanFolders,
  testPlans as seedPlans,
  testRuns as seedRuns,
  testScenarios as seedScenarios,
  users,
} from "@/data/seed";
import {
  extraDefects,
  extraPlanFolders,
  extraPlans,
  extraProcesses,
  extraRequirements,
  extraRuns,
  extraScenarios,
  extraTestCaseFolders,
  extraTestCases,
} from "@/data/seed-extra";
import { integrations as seedIntegrations, type Integration } from "@/data/integrations";
import { personaById, personaUser, type Capability, type PersonaId } from "@/data/personas";
import type {
  AppUser,
  BusinessProcess,
  ConfigValue,
  CustomField,
  Defect,
  ID,
  NotificationRule,
  Requirement,
  RunStatus,
  SlaRule,
  StepStatus,
  TestCase,
  TestCaseFolder,
  TestPlan,
  TestPlanFolder,
  TestRun,
  TestScenario,
} from "@/data/types";

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

interface State {
  processes: BusinessProcess[];
  requirements: Requirement[];
  folders: TestCaseFolder[];
  cases: TestCase[];
  scenarios: TestScenario[];
  plans: TestPlan[];
  planFolders: TestPlanFolder[];
  runs: TestRun[];
  defects: Defect[];
  config: ConfigValue[];
  customFields: CustomField[];
  slaRules: SlaRule[];
  notificationRules: NotificationRule[];
  integrations: Integration[];
  activeProjectId: ID;
  personaId: PersonaId;
  syncingIntegrationId: ID | null;
}

interface Derived {
  /** Organisation of the active project — master content is scoped to it. */
  activeOrgId: ID;
  me: AppUser;
  can: (capability: Capability) => boolean;
  /** Everything, unscoped, for cross-project rollups. */
  all: Pick<State, "plans" | "runs" | "defects" | "cases" | "requirements">;
}

interface Actions {
  setActiveProject: (id: ID) => void;
  setPersona: (id: PersonaId) => void;
  addProcess: (input: Partial<BusinessProcess> & { name: string; parentId: ID | null }) => void;
  updateProcess: (id: ID, patch: Partial<BusinessProcess>) => void;
  deleteProcess: (id: ID) => void;
  addRequirement: (input: Partial<Requirement> & { name: string }) => void;
  updateRequirement: (id: ID, patch: Partial<Requirement>) => void;
  deleteRequirement: (id: ID) => void;
  addTestCase: (input: { name: string; folderId: ID; testingType: string; priority: TestCase["priority"]; description: string }) => void;
  saveTestCaseVersion: (id: ID, steps: TestCase["versions"][number]["steps"], changeNote: string) => void;
  updateTestCase: (id: ID, patch: Partial<TestCase>) => void;
  cloneTestCase: (id: ID) => void;
  moveCasesToFolder: (ids: ID[], folderId: ID) => void;
  addScenarioToPlan: (planId: ID, scenarioId: ID) => void;
  addScenario: (input: { name: string; description: string }) => void;
  setScenarioMembers: (id: ID, memberIds: ID[]) => void;
  addPlan: (input: Omit<TestPlan, "id" | "key" | "projectId">) => void;
  updatePlan: (id: ID, patch: Partial<TestPlan>) => void;
  addRunsToPlan: (planId: ID, caseIds: ID[], folderId: ID | null) => void;
  updateRun: (id: ID, patch: Partial<TestRun>) => void;
  setRunStepStatus: (runId: ID, stepId: ID, status: StepStatus, actual?: string) => void;
  addDefect: (input: { title: string; description: string; severity: Defect["severity"]; priority: Defect["priority"]; runId: ID | null; assignee: ID }) => void;
  updateDefect: (id: ID, patch: Partial<Defect>) => void;
  addDefectComment: (id: ID, body: string) => void;
  addConfigValue: (group: string, value: string) => void;
  toggleConfigValue: (id: ID) => void;
  toggleCustomField: (id: ID) => void;
  toggleSlaRule: (id: ID) => void;
  toggleNotificationRule: (id: ID) => void;
  toggleIntegration: (id: ID) => void;
  syncIntegration: (id: ID) => Promise<void>;
}

const AppStoreContext = createContext<(State & Derived & Actions) | null>(null);

const rollupStatus = (steps: { status: StepStatus }[]): RunStatus => {
  if (steps.some((s) => s.status === "Failed")) return "Failed";
  if (steps.some((s) => s.status === "Blocked")) return "Blocked";
  if (steps.every((s) => s.status === "Passed")) return "Passed";
  if (steps.some((s) => s.status !== "Not Started")) return "In Progress";
  return "Not Started";
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    processes: [...seedProcesses, ...extraProcesses],
    requirements: [...seedRequirements, ...extraRequirements],
    folders: [...seedFolders, ...extraTestCaseFolders],
    cases: [...seedCases, ...extraTestCases],
    scenarios: [...seedScenarios, ...extraScenarios],
    plans: [...seedPlans, ...extraPlans],
    planFolders: [...seedPlanFolders, ...extraPlanFolders],
    runs: [...seedRuns, ...extraRuns],
    defects: [...seedDefects, ...extraDefects],
    config: seedConfig,
    customFields: seedCustomFields,
    slaRules: seedSlaRules,
    notificationRules: seedNotificationRules,
    integrations: seedIntegrations,
    activeProjectId: "p1",
    personaId: "manager",
    syncingIntegrationId: null,
  });

  const patch = useCallback((fn: (s: State) => Partial<State>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      setActiveProject: (id) => patch(() => ({ activeProjectId: id })),
      setPersona: (id) => patch(() => ({ personaId: id })),

      addProcess: (input) =>
        patch((s) => ({
          processes: [
            ...s.processes,
            {
              id: uid("bp"),
              orgId: orgOf(s.activeProjectId),
              name: input.name,
              parentId: input.parentId,
              levelType: input.levelType ?? "Process Step",
              application: input.application ?? "SAP ERP",
              sourceType: input.sourceType ?? "Manual",
              owner: input.owner ?? personaUser(s.personaId).id,
              description: input.description ?? "",
              tags: input.tags ?? [],
              createdBy: personaUser(s.personaId).id,
              createdOn: new Date().toISOString(),
            },
          ],
        })),
      updateProcess: (id, p) =>
        patch((s) => ({ processes: s.processes.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteProcess: (id) =>
        patch((s) => {
          const doomed = new Set<ID>([id]);
          let grew = true;
          while (grew) {
            grew = false;
            s.processes.forEach((p) => {
              if (p.parentId && doomed.has(p.parentId) && !doomed.has(p.id)) {
                doomed.add(p.id);
                grew = true;
              }
            });
          }
          return {
            processes: s.processes.filter((p) => !doomed.has(p.id)),
            requirements: s.requirements.map((r) => ({
              ...r,
              processIds: r.processIds.filter((pid) => !doomed.has(pid)),
            })),
            cases: s.cases.map((c) => ({
              ...c,
              processIds: c.processIds.filter((pid) => !doomed.has(pid)),
            })),
          };
        }),

      addRequirement: (input) =>
        patch((s) => ({
          requirements: [
            {
              id: uid("req"),
              orgId: orgOf(s.activeProjectId),
              name: input.name,
              description: input.description ?? "",
              status: input.status ?? "Draft",
              priority: input.priority ?? "Medium",
              owner: input.owner ?? personaUser(s.personaId).id,
              processIds: input.processIds ?? [],
              sourceType: input.sourceType ?? "Manual",
              tags: input.tags ?? [],
              createdOn: new Date().toISOString(),
            },
            ...s.requirements,
          ],
        })),
      updateRequirement: (id, p) =>
        patch((s) => ({ requirements: s.requirements.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteRequirement: (id) =>
        patch((s) => ({
          requirements: s.requirements.filter((x) => x.id !== id),
          cases: s.cases.map((c) => ({ ...c, requirementIds: c.requirementIds.filter((r) => r !== id) })),
        })),

      addTestCase: (input) =>
        patch((s) => {
          const key = `TC-${5000 + s.cases.length}`;
          const now = new Date().toISOString();
          const author = personaUser(s.personaId).id;
          return {
            cases: [
              {
                id: uid("tc"),
                orgId: orgOf(s.activeProjectId),
                key,
                name: input.name,
                description: input.description,
                folderId: input.folderId,
                testingType: input.testingType,
                priority: input.priority,
                owner: author,
                application: "SAP ERP",
                sourceType: "Manual",
                requirementIds: [],
                processIds: [],
                tags: [],
                versions: [
                  {
                    id: `${key}-v1`,
                    version: 1,
                    createdBy: author,
                    createdOn: now,
                    changeNote: "Initial authoring",
                    steps: [
                      {
                        id: uid("st"),
                        stepNo: 1,
                        title: "Step 1",
                        instruction: "Describe what the tester should do.",
                        expected: "Describe the expected result.",
                      },
                    ],
                  },
                ],
                createdOn: now,
              },
              ...s.cases,
            ],
          };
        }),
      saveTestCaseVersion: (id, steps, changeNote) =>
        patch((s) => ({
          cases: s.cases.map((c) => {
            if (c.id !== id) return c;
            const next = c.versions.length + 1;
            return {
              ...c,
              versions: [
                ...c.versions,
                {
                  id: `${c.key}-v${next}`,
                  version: next,
                  createdBy: personaUser(s.personaId).id,
                  createdOn: new Date().toISOString(),
                  changeNote: changeNote || "Content updated",
                  steps: steps.map((st, i) => ({ ...st, stepNo: i + 1 })),
                },
              ],
            };
          }),
        })),
      updateTestCase: (id, p) =>
        patch((s) => ({ cases: s.cases.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
      cloneTestCase: (id) =>
        patch((s) => {
          const src = s.cases.find((c) => c.id === id);
          if (!src) return {};
          const key = `TC-${5000 + s.cases.length}`;
          const now = new Date().toISOString();
          const author = personaUser(s.personaId).id;
          const latest = src.versions[src.versions.length - 1]!;
          return {
            cases: [
              {
                ...src,
                id: uid("tc"),
                key,
                name: `${src.name} (copy)`,
                owner: author,
                sourceType: "Library",
                createdOn: now,
                versions: [
                  {
                    id: `${key}-v1`,
                    version: 1,
                    createdBy: author,
                    createdOn: now,
                    changeNote: `Cloned from ${src.key} v${latest.version}`,
                    steps: latest.steps.map((st) => ({ ...st, id: uid("st") })),
                  },
                ],
              },
              ...s.cases,
            ],
          };
        }),
      moveCasesToFolder: (ids, folderId) =>
        patch((s) => ({
          cases: s.cases.map((c) => (ids.includes(c.id) ? { ...c, folderId } : c)),
        })),

      addScenario: (input) =>
        patch((s) => ({
          scenarios: [
            ...s.scenarios,
            {
              id: uid("sc"),
              orgId: orgOf(s.activeProjectId),
              key: `SCN-${String(s.scenarios.length + 1).padStart(2, "0")}`,
              name: input.name,
              description: input.description,
              owner: personaUser(s.personaId).id,
              members: [],
            },
          ],
        })),
      setScenarioMembers: (id, memberIds) =>
        patch((s) => ({
          scenarios: s.scenarios.map((sc) =>
            sc.id === id
              ? { ...sc, members: memberIds.map((testCaseId, i) => ({ testCaseId, sequence: i + 1 })) }
              : sc,
          ),
        })),

      addPlan: (input) =>
        patch((s) => ({
          plans: [
            {
              ...input,
              id: uid("pl"),
              key: `PI-${430 + s.plans.length}`,
              projectId: s.activeProjectId,
            },
            ...s.plans,
          ],
        })),
      updatePlan: (id, p) => patch((s) => ({ plans: s.plans.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

      addRunsToPlan: (planId, caseIds, folderId) =>
        patch((s) => {
          const plan = s.plans.find((p) => p.id === planId);
          const existing = s.runs.filter((r) => r.planId === planId).length;
          const newRuns: TestRun[] = caseIds.map((caseId, i) => {
            const tc = s.cases.find((c) => c.id === caseId)!;
            const version = tc.versions[tc.versions.length - 1]!;
            return {
              id: uid("run"),
              projectId: s.activeProjectId,
              planId,
              folderId,
              key: `RUN-${2500 + s.runs.length + i}`,
              sequence: existing + i + 1,
              testCaseId: caseId,
              versionId: version.id,
              versionNo: version.version,
              assignee: personaUser(s.personaId).id,
              status: "Not Started",
              priority: tc.priority,
              environment: plan?.defaultEnvironment ?? "dev-sap-04",
              steps: version.steps.map((st) => ({
                id: uid("rs"),
                stepNo: st.stepNo,
                title: st.title,
                instruction: st.instruction,
                expected: st.expected,
                status: "Not Started" as StepStatus,
              })),
            };
          });
          return { runs: [...s.runs, ...newRuns] };
        }),
      addScenarioToPlan: (planId, scenarioId) =>
        patch((s) => {
          const scenario = s.scenarios.find((sc) => sc.id === scenarioId);
          const plan = s.plans.find((p) => p.id === planId);
          if (!scenario) return {};
          const folder: TestPlanFolder = {
            id: uid("pf"),
            planId,
            name: scenario.name,
            parentId: null,
          };
          const existing = s.runs.filter((r) => r.planId === planId).length;
          const ordered = [...scenario.members].sort((a, b) => a.sequence - b.sequence);
          const newRuns: TestRun[] = ordered.map((m, i) => {
            const tc = s.cases.find((c) => c.id === m.testCaseId)!;
            const version = tc.versions[tc.versions.length - 1]!;
            return {
              id: uid("run"),
              projectId: s.activeProjectId,
              planId,
              folderId: folder.id,
              key: `RUN-${2500 + s.runs.length + i}`,
              sequence: existing + i + 1,
              testCaseId: tc.id,
              versionId: version.id,
              versionNo: version.version,
              assignee: personaUser(s.personaId).id,
              status: "Not Started",
              priority: tc.priority,
              environment: plan?.defaultEnvironment ?? "dev-sap-04",
              steps: version.steps.map((st) => ({
                id: uid("rs"),
                stepNo: st.stepNo,
                title: st.title,
                instruction: st.instruction,
                expected: st.expected,
                status: "Not Started" as StepStatus,
              })),
            };
          });
          return { planFolders: [...s.planFolders, folder], runs: [...s.runs, ...newRuns] };
        }),
      updateRun: (id, p) => patch((s) => ({ runs: s.runs.map((r) => (r.id === id ? { ...r, ...p } : r)) })),
      setRunStepStatus: (runId, stepId, status, actual) =>
        patch((s) => ({
          runs: s.runs.map((r) => {
            if (r.id !== runId) return r;
            const steps = r.steps.map((st) =>
              st.id === stepId ? { ...st, status, actual: actual ?? st.actual } : st,
            );
            const rollup = rollupStatus(steps);
            return {
              ...r,
              steps,
              status: rollup,
              executedBy: personaUser(s.personaId).id,
              executionStart: r.executionStart ?? new Date().toISOString(),
              executionEnd:
                rollup === "Passed" || rollup === "Failed" ? new Date().toISOString() : undefined,
            };
          }),
        })),

      addDefect: (input) =>
        patch((s) => ({
          defects: [
            {
              id: uid("df"),
              projectId: s.activeProjectId,
              key: `DEF-${2100 + s.defects.length}`,
              runId: input.runId,
              title: input.title,
              description: input.description,
              status: "New",
              severity: input.severity,
              priority: input.priority,
              assignee: input.assignee,
              reportedBy: personaUser(s.personaId).id,
              reportedOn: new Date().toISOString(),
              slaRuleId:
                input.severity === "Critical"
                  ? "sla1"
                  : input.severity === "High"
                    ? "sla2"
                    : input.severity === "Medium"
                      ? "sla3"
                      : "sla4",
              comments: [],
            },
            ...s.defects,
          ],
        })),
      updateDefect: (id, p) =>
        patch((s) => ({
          defects: s.defects.map((d) =>
            d.id === id
              ? {
                  ...d,
                  ...p,
                  resolvedOn:
                    p.status === "Resolved" || p.status === "Closed"
                      ? (d.resolvedOn ?? new Date().toISOString())
                      : d.resolvedOn,
                  respondedOn:
                    p.status && p.status !== "New" ? (d.respondedOn ?? new Date().toISOString()) : d.respondedOn,
                }
              : d,
          ),
        })),
      addDefectComment: (id, body) =>
        patch((s) => ({
          defects: s.defects.map((d) =>
            d.id === id
              ? {
                  ...d,
                  comments: [
                    ...d.comments,
                    { id: uid("c"), author: personaUser(s.personaId).id, on: new Date().toISOString(), body },
                  ],
                }
              : d,
          ),
        })),

      addConfigValue: (group, value) =>
        patch((s) => ({
          config: [
            ...s.config,
            { id: uid("cv"), group, value, order: s.config.filter((c) => c.group === group).length + 1, active: true },
          ],
        })),
      toggleConfigValue: (id) =>
        patch((s) => ({ config: s.config.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),
      toggleCustomField: (id) =>
        patch((s) => ({ customFields: s.customFields.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),
      toggleSlaRule: (id) =>
        patch((s) => ({ slaRules: s.slaRules.map((c) => (c.id === id ? { ...c, active: !c.active } : c)) })),
      toggleNotificationRule: (id) =>
        patch((s) => ({
          notificationRules: s.notificationRules.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
        })),
      toggleIntegration: (id) =>
        patch((s) => ({
          integrations: s.integrations.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: i.status === "Connected" ? "Not connected" : "Connected",
                  lastSync: i.status === "Connected" ? undefined : new Date().toISOString(),
                  recordCount: i.status === "Connected" ? undefined : (i.recordCount ?? 0),
                }
              : i,
          ),
        })),
      syncIntegration: async (id) => {
        patch(() => ({ syncingIntegrationId: id }));
        await new Promise((r) => setTimeout(r, 1600));
        patch((s) => ({
          syncingIntegrationId: null,
          integrations: s.integrations.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: "Connected",
                  lastSync: new Date().toISOString(),
                  recordCount: (i.recordCount ?? 0) + 17,
                }
              : i,
          ),
        }));
      },
    }),
    [patch],
  );

  const value = useMemo(() => {
    const activeOrgId = orgOf(state.activeProjectId);
    const persona = personaById(state.personaId);
    const me = personaUser(state.personaId);
    const ownRunsOnly = persona.id === "tester" || persona.id === "client";

    const plans = state.plans.filter((p) => p.projectId === state.activeProjectId);
    const planIds = new Set(plans.map((p) => p.id));
    const allProjectRuns = state.runs.filter((r) => r.projectId === state.activeProjectId);
    const runs = ownRunsOnly ? allProjectRuns.filter((r) => r.assignee === me.id) : allProjectRuns;
    const visibleRunIds = new Set(runs.map((r) => r.id));
    const projectDefects = state.defects.filter((d) => d.projectId === state.activeProjectId);

    return {
      ...state,
      ...actions,
      activeOrgId,
      me,
      can: (capability: Capability) => persona.capabilities.includes(capability),
      processes: state.processes.filter((p) => p.orgId === activeOrgId),
      requirements: state.requirements.filter((r) => r.orgId === activeOrgId),
      folders: state.folders.filter((f) => f.orgId === activeOrgId),
      cases: state.cases.filter((c) => c.orgId === activeOrgId),
      scenarios: state.scenarios.filter((sc) => sc.orgId === activeOrgId),
      plans,
      planFolders: state.planFolders.filter((f) => planIds.has(f.planId)),
      runs,
      defects: ownRunsOnly
        ? projectDefects.filter((d) => (d.runId ? visibleRunIds.has(d.runId) : false) || d.reportedBy === me.id || d.assignee === me.id)
        : projectDefects,
      all: {
        plans: state.plans,
        runs: state.runs,
        defects: state.defects,
        cases: state.cases,
        requirements: state.requirements,
      },
    };
  }, [state, actions]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

const orgOf = (projectId: ID) => projects.find((p) => p.id === projectId)?.orgId ?? "org1";

export function useStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}

export { users, organizations, projects, currentUser };

export const userById = (id?: string) => users.find((u) => u.id === id);
export const userName = (id?: string) => userById(id)?.name ?? "Unassigned";

export function runCounts(runs: { status: RunStatus }[]) {
  const base: Record<RunStatus, number> = {
    "Not Started": 0,
    "In Progress": 0,
    Passed: 0,
    Failed: 0,
    Blocked: 0,
  };
  for (const r of runs) base[r.status] = (base[r.status] ?? 0) + 1;
  return base;
}
