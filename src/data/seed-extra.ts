/**
 * Second organisation (Halden Retail Group) master content plus execution data
 * for the two projects outside the flagship one, so switching organisation or
 * project genuinely changes what the workspace contains.
 */
import type {
  BusinessProcess,
  Defect,
  Requirement,
  RunStatus,
  StepStatus,
  TestCase,
  TestCaseFolder,
  TestPlan,
  TestPlanFolder,
  TestRun,
  TestRunStep,
  TestScenario,
} from "./types";

const iso = (daysAgo: number, hour = 9) => {
  const d = new Date(Date.UTC(2026, 8, 7, hour, 12, 0));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
};

/* --------------------------------------------------- org2 business processes */

const procSeed: [string, string | null, string, string][] = [
  ["Commerce", null, "Line of Business", "Custom Web"],
  ["Order Capture", "o2-bp1", "Process Group", "Custom Web"],
  ["Checkout and payment", "o2-bp2", "Scope Item", "Custom Web"],
  ["Basket promotions", "o2-bp2", "Scope Item", "Custom Web"],
  ["Fulfilment", null, "Line of Business", "Custom Web"],
  ["Store pickup", "o2-bp5", "Process Group", "Custom Web"],
  ["Click and collect handover", "o2-bp6", "Scope Item", "Custom Web"],
  ["Returns and refunds", "o2-bp5", "Process Group", "ServiceNow"],
];

export const extraProcesses: BusinessProcess[] = procSeed.map(([name, parentId, levelType, application], i) => ({
  id: `o2-bp${i + 1}`,
  orgId: "org2",
  name,
  parentId,
  levelType,
  application,
  sourceType: i % 3 === 0 ? "Integration" : "Manual",
  integrationSource: i % 3 === 0 ? "Signavio" : undefined,
  owner: i % 2 === 0 ? "u5" : "u2",
  description: `${name} process for the modernised order platform.`,
  tags: i % 2 === 0 ? ["wave-1"] : ["standard"],
  createdBy: "u2",
  createdOn: iso(40 - i),
}));

export const extraRequirements: Requirement[] = [
  ["Guest checkout completes without account creation", "A guest must be able to pay and receive confirmation without registering.", "Approved", "Critical"],
  ["Promotion stacking respects the priority table", "Only the highest-priority promotion applies when two overlap on one basket.", "In Review", "High"],
  ["Click and collect handover requires ID scan", "Store colleagues must scan the collection code before releasing goods.", "Approved", "High"],
  ["Refund returns to the original payment method", "Refunds must be issued to the tender used at purchase within 5 days.", "Test Ready", "Medium"],
  ["Basket recovers after session timeout", "A signed-in basket must survive a 30 minute timeout.", "Draft", "Low"],
].map(([name, description, status, priority], i) => ({
  id: `o2-req${i + 1}`,
  orgId: "org2",
  name: name!,
  description: description!,
  status: status!,
  priority: priority as Requirement["priority"],
  owner: i % 2 === 0 ? "u5" : "u2",
  processIds: [extraProcesses[(i % 4) + 2]!.id],
  sourceType: i === 1 ? "Agent" : "Manual",
  tags: ["retail"],
  createdOn: iso(35 - i * 2),
}));

export const extraTestCaseFolders: TestCaseFolder[] = [
  { id: "o2-f1", orgId: "org2", name: "Commerce", parentId: null },
  { id: "o2-f2", orgId: "org2", name: "Checkout", parentId: "o2-f1" },
  { id: "o2-f3", orgId: "org2", name: "Fulfilment", parentId: null },
];

const caseSeed: [string, string, string, TestCase["priority"], string][] = [
  ["Guest checkout with card payment", "o2-f2", "Regression", "Critical", "Custom Web"],
  ["Promotion stacking priority resolution", "o2-f2", "Regression", "High", "Custom Web"],
  ["Basket persistence after session timeout", "o2-f2", "Integration", "Low", "Custom Web"],
  ["Click and collect handover with code scan", "o2-f3", "UAT", "High", "Custom Web"],
  ["Refund to original tender", "o2-f3", "Integration", "Medium", "ServiceNow"],
  ["Store stock reservation on collect order", "o2-f3", "Regression", "Medium", "Custom Web"],
];

const stepsFor = (name: string, count: number) =>
  [
    ["Open the storefront", `Open the journey used for ${name.toLowerCase()}.`, "Navigate", "Storefront loads against the test tenant."],
    ["Build the basket", "Add the scenario items with the configured quantities.", "Type", "Basket totals recalculate correctly."],
    ["Apply the rule under test", "Trigger the promotion, payment or handover rule.", "Click", "The platform applies the configured rule."],
    ["Complete the transaction", "Confirm and capture the resulting order number.", "Click", "Order confirmation is displayed with a unique number."],
    ["Verify downstream record", "Check the order management record for the same values.", "Verify", "Downstream record matches the storefront order."],
    ["Verify notification", "Confirm the customer notification is generated.", "Verify", "Notification is queued with the correct template."],
  ]
    .slice(0, count)
    .map(([title, instruction, action, expected], i) => ({
      id: `${name}-s${i}`.replace(/\s+/g, "-").toLowerCase(),
      stepNo: i + 1,
      title: title!,
      instruction: instruction!,
      action: action!,
      expected: expected!,
    }));

export const extraTestCases: TestCase[] = caseSeed.map(([name, folderId, testingType, priority, application], i) => {
  const key = `TC-${7100 + i * 23}`;
  return {
    id: `o2-tc${i + 1}`,
    orgId: "org2",
    key,
    name,
    description: `Validates ${name.toLowerCase()} on the modernised order platform.`,
    folderId,
    testingType,
    priority,
    owner: i % 2 === 0 ? "u5" : "u3",
    application,
    sourceType: i === 2 ? "Agent" : "Manual",
    requirementIds: [extraRequirements[i % extraRequirements.length]!.id],
    processIds: [extraProcesses[(i % 4) + 2]!.id],
    tags: ["retail"],
    versions: [
      {
        id: `${key}-v1`,
        version: 1,
        createdBy: "u5",
        createdOn: iso(30 - i),
        changeNote: "Initial authoring from the discovery workshop",
        steps: stepsFor(name, 4 + (i % 3)),
      },
    ],
    createdOn: iso(30 - i),
  };
});

export const extraScenarios: TestScenario[] = [
  {
    id: "o2-sc1",
    orgId: "org2",
    key: "SC-3001",
    name: "Guest purchase to collection",
    description: "End-to-end retail journey from guest checkout through store collection.",
    owner: "u5",
    members: [
      { testCaseId: "o2-tc1", sequence: 1 },
      { testCaseId: "o2-tc6", sequence: 2 },
      { testCaseId: "o2-tc4", sequence: 3 },
    ],
  },
  {
    id: "o2-sc2",
    orgId: "org2",
    key: "SC-3002",
    name: "Promotion and refund cycle",
    description: "Applies a stacked promotion then refunds the discounted order.",
    owner: "u2",
    members: [
      { testCaseId: "o2-tc2", sequence: 1 },
      { testCaseId: "o2-tc5", sequence: 2 },
    ],
  },
];

/* ------------------------------------------------------------ project plans */

export const extraPlans: TestPlan[] = [
  {
    id: "pl4",
    projectId: "p2",
    key: "PI-0510",
    name: "Wave 2 Explore Validation",
    description: "Early validation of the localised process variants for the EMEA rollout.",
    status: "Planned",
    owner: "u1",
    startDate: iso(-3).slice(0, 10),
    endDate: iso(-24).slice(0, 10),
    defaultEnvironment: "qa-sap-02",
    testingType: "Integration",
  },
  {
    id: "pl5",
    projectId: "p3",
    key: "PI-0602",
    name: "Commerce Regression Cycle 1",
    description: "Regression across checkout, promotions and fulfilment for the new platform.",
    status: "In Progress",
    owner: "u5",
    startDate: iso(9).slice(0, 10),
    endDate: iso(-6).slice(0, 10),
    defaultEnvironment: "uat-sap-01",
    testingType: "Regression",
  },
];

export const extraPlanFolders: TestPlanFolder[] = [
  { id: "pf7", planId: "pl4", name: "Localisation", parentId: null },
  { id: "pf8", planId: "pl5", name: "Checkout", parentId: null },
  { id: "pf9", planId: "pl5", name: "Fulfilment", parentId: null },
];

const runSteps = (steps: { title: string; instruction: string; expected: string }[], status: RunStatus): TestRunStep[] =>
  steps.map((s, i) => {
    let stepStatus: StepStatus = "Not Started";
    if (status === "Passed") stepStatus = "Passed";
    else if (status === "Failed") stepStatus = i < steps.length - 1 ? "Passed" : "Failed";
    else if (status === "Blocked") stepStatus = i < 2 ? "Passed" : "Blocked";
    else if (status === "In Progress") stepStatus = i < Math.ceil(steps.length / 2) ? "Passed" : "Not Started";
    return {
      id: `o2-rs-${s.title}-${i}`.replace(/\s+/g, "-").toLowerCase(),
      stepNo: i + 1,
      title: s.title,
      instruction: s.instruction,
      expected: s.expected,
      status: stepStatus,
      actual: stepStatus === "Failed" ? "Platform returned error PAY-402 — tender not accepted." : undefined,
    };
  });

const p3Statuses: RunStatus[] = ["Passed", "Failed", "Passed", "In Progress", "Blocked", "Passed", "Not Started", "Passed"];

export const extraRuns: TestRun[] = [
  // EMEA Rollout Wave 2 — planning phase, nothing executed yet.
  ...["o2", "o2", "o2"].map((_, i) => {
    const tc = extraTestCases[i]!;
    const version = tc.versions[0]!;
    return {
      id: `run-p2-${i + 1}`,
      projectId: "p2",
      planId: "pl4",
      folderId: "pf7",
      key: `RUN-3100${i + 1}`,
      sequence: i + 1,
      testCaseId: tc.id,
      versionId: version.id,
      versionNo: version.version,
      assignee: i % 2 === 0 ? "u4" : "u6",
      status: "Not Started" as RunStatus,
      priority: tc.priority,
      environment: "qa-sap-02",
      steps: runSteps(version.steps, "Not Started"),
    } satisfies TestRun;
  }),
  // Order Platform Modernisation — live regression cycle.
  ...extraTestCases.flatMap((tc, i) => {
    const version = tc.versions[0]!;
    return [0, 1].map((round) => {
      const n = i * 2 + round;
      const status = p3Statuses[n % p3Statuses.length]!;
      return {
        id: `run-p3-${n + 1}`,
        projectId: "p3",
        planId: "pl5",
        folderId: i < 3 ? "pf8" : "pf9",
        key: `RUN-3200${n + 1}`,
        sequence: n + 1,
        testCaseId: tc.id,
        versionId: version.id,
        versionNo: version.version,
        assignee: ["u3", "u4", "u6", "u8"][n % 4]!,
        status,
        priority: tc.priority,
        environment: round === 0 ? "uat-sap-01" : "qa-sap-02",
        executedBy: status === "Not Started" ? undefined : ["u3", "u4", "u6", "u8"][n % 4]!,
        executionStart: status === "Not Started" ? undefined : iso(5 - (n % 4), 8),
        executionEnd: status === "Passed" || status === "Failed" ? iso(5 - (n % 4), 12) : undefined,
        steps: runSteps(version.steps, status),
      } satisfies TestRun;
    });
  }),
];

const failing = extraRuns.filter((r) => r.status === "Failed" || r.status === "Blocked");

export const extraDefects: Defect[] = [
  ["Card tender rejected for guest checkout", "Guest orders paid by card fail with PAY-402 while the same card succeeds for signed-in customers.", "Critical", "New"],
  ["Stacked promotion applies both discounts", "Two overlapping promotions both apply, discounting the basket twice.", "High", "In Progress"],
  ["Collection code accepted after expiry", "An expired collection code still releases the goods in store.", "Medium", "Triaged"],
].map(([title, description, severity, status], i) => {
  const run = failing[i % Math.max(1, failing.length)];
  const sev = severity as Defect["severity"];
  return {
    id: `o2-def${i + 1}`,
    projectId: "p3",
    key: `DEF-51${i + 1}`,
    runId: run?.id ?? null,
    title: title!,
    description: description!,
    status: status as Defect["status"],
    severity: sev,
    priority: sev,
    assignee: i % 2 === 0 ? "u5" : "u2",
    reportedBy: "u3",
    reportedOn: iso(4 - i, 10),
    slaRuleId: sev === "Critical" ? "sla1" : sev === "High" ? "sla2" : sev === "Medium" ? "sla3" : "sla4",
    respondedOn: i === 0 ? undefined : iso(3 - i, 12),
    comments: [
      {
        id: `o2-def${i + 1}-c1`,
        author: "u3",
        on: iso(4 - i, 11),
        body: "Reproduced twice on the UAT tenant with the scenario data set.",
      },
    ],
  } satisfies Defect;
});
