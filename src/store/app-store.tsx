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
import type {
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
  activeProjectId: ID;
}

interface Actions {
  setActiveProject: (id: ID) => void;
  addProcess: (input: Partial<BusinessProcess> & { name: string; parentId: ID | null }) => void;
  updateProcess: (id: ID, patch: Partial<BusinessProcess>) => void;
  deleteProcess: (id: ID) => void;
  addRequirement: (input: Partial<Requirement> & { name: string }) => void;
  updateRequirement: (id: ID, patch: Partial<Requirement>) => void;
  deleteRequirement: (id: ID) => void;
  addTestCase: (input: { name: string; folderId: ID; testingType: string; priority: TestCase["priority"]; description: string }) => void;
  saveTestCaseVersion: (id: ID, steps: TestCase["versions"][number]["steps"], changeNote: string) => void;
  updateTestCase: (id: ID, patch: Partial<TestCase>) => void;
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
}

const AppStoreContext = createContext<(State & Actions) | null>(null);

const rollupStatus = (steps: { status: StepStatus }[]): RunStatus => {
  if (steps.some((s) => s.status === "Failed")) return "Failed";
  if (steps.some((s) => s.status === "Blocked")) return "Blocked";
  if (steps.every((s) => s.status === "Passed")) return "Passed";
  if (steps.some((s) => s.status !== "Not Started")) return "In Progress";
  return "Not Started";
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({
    processes: seedProcesses,
    requirements: seedRequirements,
    folders: seedFolders,
    cases: seedCases,
    scenarios: seedScenarios,
    plans: seedPlans,
    planFolders: seedPlanFolders,
    runs: seedRuns,
    defects: seedDefects,
    config: seedConfig,
    customFields: seedCustomFields,
    slaRules: seedSlaRules,
    notificationRules: seedNotificationRules,
    activeProjectId: "p1",
  });

  const patch = useCallback((fn: (s: State) => Partial<State>) => {
    setState((s) => ({ ...s, ...fn(s) }));
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      setActiveProject: (id) => patch(() => ({ activeProjectId: id })),

      addProcess: (input) =>
        patch((s) => ({
          processes: [
            ...s.processes,
            {
              id: uid("bp"),
              orgId: "org1",
              name: input.name,
              parentId: input.parentId,
              levelType: input.levelType ?? "Process Step",
              application: input.application ?? "SAP ERP",
              sourceType: input.sourceType ?? "Manual",
              owner: input.owner ?? currentUser.id,
              description: input.description ?? "",
              tags: input.tags ?? [],
              createdBy: currentUser.id,
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
              orgId: "org1",
              name: input.name,
              description: input.description ?? "",
              status: input.status ?? "Draft",
              priority: input.priority ?? "Medium",
              owner: input.owner ?? currentUser.id,
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
          return {
            cases: [
              {
                id: uid("tc"),
                orgId: "org1",
                key,
                name: input.name,
                description: input.description,
                folderId: input.folderId,
                testingType: input.testingType,
                priority: input.priority,
                owner: currentUser.id,
                application: "SAP ERP",
                sourceType: "Manual",
                requirementIds: [],
                processIds: [],
                tags: [],
                versions: [
                  {
                    id: `${key}-v1`,
                    version: 1,
                    createdBy: currentUser.id,
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
                  createdBy: currentUser.id,
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

      addScenario: (input) =>
        patch((s) => ({
          scenarios: [
            ...s.scenarios,
            {
              id: uid("sc"),
              orgId: "org1",
              key: `SCN-${String(s.scenarios.length + 1).padStart(2, "0")}`,
              name: input.name,
              description: input.description,
              owner: currentUser.id,
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
            const version = tc.versions[tc.versions.length - 1];
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
              assignee: currentUser.id,
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
              executedBy: currentUser.id,
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
              reportedBy: currentUser.id,
              reportedOn: new Date().toISOString(),
              slaRuleId:
                input.severity === "Sev 1"
                  ? "sla1"
                  : input.severity === "Sev 2"
                    ? "sla2"
                    : input.severity === "Sev 3"
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
                    { id: uid("c"), author: currentUser.id, on: new Date().toISOString(), body },
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
    }),
    [patch],
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}

export { users, organizations, projects, currentUser };

export const userById = (id?: string) => users.find((u) => u.id === id);
export const userName = (id?: string) => userById(id)?.name ?? "Unassigned";
