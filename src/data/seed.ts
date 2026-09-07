import type {
  AppUser,
  BusinessProcess,
  ConfigValue,
  CustomField,
  Defect,
  NotificationRule,
  Organization,
  Priority,
  Project,
  Requirement,
  RunStatus,
  SlaRule,
  TestCase,
  TestCaseFolder,
  TestPlan,
  TestPlanFolder,
  TestRun,
  TestRunStep,
  TestScenario,
  StepStatus,
} from "./types";

const iso = (daysAgo: number, hour = 9) => {
  const d = new Date(Date.UTC(2026, 8, 7, hour, 12, 0));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
};

export const users: AppUser[] = [
  { id: "u1", name: "Divya Raman", initials: "DR", role: "Test Manager" },
  { id: "u2", name: "Anders Brandt", initials: "AB", role: "Functional Consultant" },
  { id: "u3", name: "Luisa Ferreira", initials: "LF", role: "Tester" },
  { id: "u4", name: "Mide Okafor", initials: "MO", role: "Tester" },
  { id: "u5", name: "Sora Nakamura", initials: "SN", role: "Functional Consultant" },
  { id: "u6", name: "Peter Aluko", initials: "PA", role: "Tester" },
  { id: "u7", name: "Hannah Voss", initials: "HV", role: "Admin" },
  { id: "u8", name: "Ravi Menon", initials: "RM", role: "Client Stakeholder" },
];

export const currentUser: AppUser = users[0]!;

export const organizations: Organization[] = [
  { id: "org1", name: "Nortaxis Systems", industry: "Industrial Manufacturing" },
  { id: "org2", name: "Halden Retail Group", industry: "Retail" },
];

export const projects: Project[] = [
  { id: "p1", orgId: "org1", name: "S/4HANA Core Implementation", kind: "SAP", phase: "Realize · Sprint 14" },
  { id: "p2", orgId: "org1", name: "EMEA Rollout Wave 2", kind: "SAP", phase: "Explore" },
  { id: "p3", orgId: "org2", name: "Order Platform Modernisation", kind: "Non-SAP", phase: "Realize" },
];

const cfg = (group: string, values: string[], startAt = 1): ConfigValue[] =>
  values.map((value, i) => ({
    id: `cv-${group}-${i}`.toLowerCase().replace(/\s+/g, "-"),
    group,
    value,
    order: startAt + i,
    active: true,
  }));

export const configValues: ConfigValue[] = [
  ...cfg("Test Run Status", ["Not Started", "In Progress", "Passed", "Failed", "Blocked"]),
  ...cfg("Defect Status", ["New", "Triaged", "In Progress", "Resolved", "Closed", "Rejected"]),
  ...cfg("Severity", ["Sev 1", "Sev 2", "Sev 3", "Sev 4"]),
  ...cfg("Priority", ["Critical", "High", "Medium", "Low"]),
  ...cfg("Testing Type", ["Unit", "String", "Integration", "Regression", "UAT", "Performance"]),
  ...cfg("Environment", ["dev-sap-04", "qa-sap-02", "uat-sap-01", "perf-sap-1"]),
  ...cfg("Application", ["SAP ERP", "SAP Ariba", "SAP SuccessFactors", "ServiceNow", "Custom Web"]),
  ...cfg("Source Type", ["Manual", "Integration", "Agent"]),
  ...cfg("Level Type", ["Line of Business", "Process Group", "Scope Item", "Variant", "Process Step"]),
  ...cfg("Requirement Status", ["Draft", "In Review", "Approved", "Test Ready", "Signed Off"]),
];

export const customFields: CustomField[] = [
  { id: "cf1", entity: "Test Case", label: "Automation Candidate", type: "Checkbox", required: false, active: true },
  { id: "cf2", entity: "Defect", label: "Root Cause Area", type: "Picklist", required: false, active: true },
  { id: "cf3", entity: "Requirement", label: "Fit-Gap Reference", type: "Text", required: false, active: true },
  { id: "cf4", entity: "Test Plan", label: "Sign-off Reviewer", type: "Text", required: true, active: true },
  { id: "cf5", entity: "Business Process", label: "Regulatory Scope", type: "Checkbox", required: false, active: false },
];

export const slaRules: SlaRule[] = [
  { id: "sla1", name: "Sev 1 — Production Blocker", appliesTo: "Defect · Severity = Sev 1", condition: "Business hours 24×5", responseHours: 2, resolutionHours: 8, active: true },
  { id: "sla2", name: "Sev 2 — Major", appliesTo: "Defect · Severity = Sev 2", condition: "Business hours 24×5", responseHours: 4, resolutionHours: 24, active: true },
  { id: "sla3", name: "Sev 3 — Minor", appliesTo: "Defect · Severity = Sev 3", condition: "Business hours", responseHours: 8, resolutionHours: 72, active: true },
  { id: "sla4", name: "Sev 4 — Cosmetic", appliesTo: "Defect · Severity = Sev 4", condition: "Best effort", responseHours: 24, resolutionHours: 168, active: true },
];

export const notificationRules: NotificationRule[] = [
  { id: "nr1", name: "Defect ageing escalation", trigger: "Defect ageing > 2 days AND status ≠ Resolved", cadence: "Daily Recurring", recipients: "Test Manager, Defect Assignee", active: true },
  { id: "nr2", name: "Plan overdue runs", trigger: "Plan end date < today AND run status ≠ Completed", cadence: "Daily Recurring", recipients: "Test Plan Owner", active: true },
  { id: "nr3", name: "SLA breach alert", trigger: "Defect resolution SLA breached", cadence: "Immediate", recipients: "Test Manager, Delivery Lead", active: true },
  { id: "nr4", name: "UAT weekly digest", trigger: "Every Monday 08:00", cadence: "Weekly", recipients: "Client Stakeholders", active: false },
];

/* ---------------------------------------------------------------- processes */

interface ProcSpec {
  name: string;
  children?: ProcSpec[];
}

const processTree: ProcSpec[] = [
  {
    name: "Source to Pay",
    children: [
      {
        name: "Operational Procurement",
        children: [
          { name: "Purchase Requisition", children: [{ name: "Create requisition" }, { name: "Release strategy" }] },
          { name: "Purchase Order Processing", children: [{ name: "Create PO" }, { name: "PO release" }, { name: "Goods receipt" }] },
        ],
      },
      { name: "Invoice Management", children: [{ name: "Invoice verification", children: [{ name: "Three-way match" }] }] },
    ],
  },
  {
    name: "Order to Cash",
    children: [
      {
        name: "Sales Order Management",
        children: [
          { name: "Standard Sales Order", children: [{ name: "Create order" }, { name: "Availability check" }] },
          { name: "Delivery & Shipping", children: [{ name: "Create delivery" }, { name: "Post goods issue" }] },
        ],
      },
      { name: "Billing", children: [{ name: "Customer invoice", children: [{ name: "Create billing document" }] }] },
    ],
  },
  {
    name: "Record to Report",
    children: [
      { name: "General Ledger", children: [{ name: "Period-End Close", children: [{ name: "Run closing cockpit" }] }] },
      { name: "Cost Accounting", children: [{ name: "Cost Center Postings", children: [{ name: "Post cost allocation" }] }] },
    ],
  },
];

const levelTypes = ["Line of Business", "Process Group", "Scope Item", "Variant", "Process Step"];
const applications = ["SAP ERP", "SAP Ariba", "ServiceNow", "Custom Web"];

export const businessProcesses: BusinessProcess[] = (() => {
  const out: BusinessProcess[] = [];
  let n = 0;
  const walk = (nodes: ProcSpec[], parentId: string | null, depth: number) => {
    nodes.forEach((node) => {
      n += 1;
      const id = `bp${n}`;
      out.push({
        id,
        orgId: "org1",
        name: node.name,
        parentId,
        levelType: levelTypes[Math.min(depth, 4)]!,
        application: applications[n % applications.length]!,
        sourceType: n % 5 === 0 ? "Integration" : n % 7 === 0 ? "Agent" : "Manual",
        integrationSource: n % 5 === 0 ? "SAP Cloud ALM" : undefined,
        owner: users[n % users.length]!.id,
        description: `${node.name} — mapped during Explore workshops.`,
        tags: depth === 0 ? ["core"] : depth >= 3 ? ["executable"] : [],
        createdBy: "u2",
        createdOn: iso(60 - n),
      });
      if (node.children) walk(node.children, id, depth + 1);
    });
  };
  walk(processTree, null, 0);
  return out;
})();

const leafProcesses = businessProcesses.filter(
  (p) => !businessProcesses.some((c) => c.parentId === p.id),
);

/* ------------------------------------------------------------ requirements */

const reqSeeds: [string, string, string, Priority][] = [
  ["Automatic release strategy for POs above 50k EUR", "Purchase orders above the threshold must route through a two-level release strategy before transmission.", "Approved", "Critical"],
  ["Three-way match tolerance of 2%", "Invoice verification must auto-post when PO, GR and invoice agree within a 2% tolerance.", "Test Ready", "High"],
  ["Availability check against ATP in sales orders", "Sales order creation must confirm quantities against real-time ATP.", "Test Ready", "High"],
  ["Delivery split by shipping point", "Deliveries must split automatically when items belong to different shipping points.", "Approved", "Medium"],
  ["Billing document output to customer portal", "Every billing document must publish a PDF to the customer portal within 5 minutes.", "In Review", "Medium"],
  ["Period-end close cockpit task list", "Closing cockpit must present a task list with owner and status per company code.", "Approved", "High"],
  ["Cost allocation cycle for shared services", "Monthly assessment cycles must allocate shared service cost centres by headcount.", "Draft", "Medium"],
  ["Goods receipt posting with batch capture", "Goods receipt must capture batch and expiry for all managed materials.", "Test Ready", "Critical"],
  ["Requisition approval mobile notification", "Approvers must receive a mobile push within 60 seconds of a requisition submission.", "In Review", "Low"],
  ["Post goods issue reverses on delivery cancellation", "Cancelling a delivery must reverse the goods issue document.", "Approved", "High"],
  ["Invoice parking for missing GR", "Invoices without goods receipt must park rather than block.", "Signed Off", "Medium"],
  ["Sales order pricing condition audit trail", "All manual price condition changes must record user, timestamp and reason.", "Approved", "High"],
];

export const requirements: Requirement[] = reqSeeds.map(([name, description, status, priority], i) => ({
  id: `req${i + 1}`,
  orgId: "org1",
  name,
  description,
  status,
  priority,
  owner: users[(i + 1) % users.length]!.id,
  processIds: [leafProcesses[i % leafProcesses.length]!.id, leafProcesses[(i + 3) % leafProcesses.length]!.id],
  sourceType: i % 4 === 0 ? "Document" : i % 5 === 0 ? "Agent" : "Manual",
  tags: i % 3 === 0 ? ["fit-gap"] : ["standard"],
  createdOn: iso(50 - i),
}));

/* -------------------------------------------------------------- test cases */

export const testCaseFolders: TestCaseFolder[] = [
  { id: "f1", orgId: "org1", name: "Source to Pay", parentId: null },
  { id: "f2", orgId: "org1", name: "Procurement", parentId: "f1" },
  { id: "f3", orgId: "org1", name: "Invoicing", parentId: "f1" },
  { id: "f4", orgId: "org1", name: "Order to Cash", parentId: null },
  { id: "f5", orgId: "org1", name: "Sales & Delivery", parentId: "f4" },
  { id: "f6", orgId: "org1", name: "Record to Report", parentId: null },
];

const caseSeeds: [string, string, string, Priority, string][] = [
  ["Purchase Order Release — two level strategy", "f2", "Regression", "Critical", "SAP ERP"],
  ["Purchase Requisition creation with cost centre", "f2", "Integration", "High", "SAP ERP"],
  ["Goods Receipt posting with batch capture", "f2", "Regression", "Critical", "SAP ERP"],
  ["Three-way match within tolerance", "f3", "Integration", "High", "SAP ERP"],
  ["Invoice parking without goods receipt", "f3", "Regression", "Medium", "SAP ERP"],
  ["Supplier invoice cancellation", "f3", "Regression", "Medium", "SAP Ariba"],
  ["Sales Order creation with ATP check", "f5", "Integration", "Critical", "SAP ERP"],
  ["Delivery split by shipping point", "f5", "Regression", "Medium", "SAP ERP"],
  ["Post Goods Issue and reversal", "f5", "Regression", "High", "SAP ERP"],
  ["Customer billing document creation", "f5", "UAT", "High", "SAP ERP"],
  ["Pricing condition manual override audit", "f5", "Regression", "High", "SAP ERP"],
  ["Period-End Close cockpit task list", "f6", "UAT", "Critical", "SAP ERP"],
  ["Cost centre allocation cycle run", "f6", "Integration", "Medium", "SAP ERP"],
  ["GL account balance carry forward", "f6", "Regression", "Medium", "SAP ERP"],
  ["Requisition approval mobile push", "f2", "Integration", "Low", "Custom Web"],
  ["Work centre capacity evaluation", "f6", "Performance", "Medium", "SAP ERP"],
  ["Customer portal invoice publication", "f3", "Integration", "Medium", "Custom Web"],
  ["Vendor master data replication", "f2", "Integration", "High", "ServiceNow"],
];

const stepTemplate = (caseName: string, variant: number) => {
  const base = [
    ["Open transaction", `Launch the app used for ${caseName.toLowerCase()}.`, "Navigate", "Entry screen opens with the correct company code."],
    ["Enter header data", "Populate the mandatory header fields from the test data sheet.", "Type", "No mandatory-field errors are raised."],
    ["Enter item data", "Add the line items with quantity, plant and price.", "Type", "Items accepted; net value recalculates."],
    ["Trigger the business rule", "Execute the check or release step under test.", "Click", "System applies the configured rule."],
    ["Save the document", "Save and note the generated document number.", "Click", "Document is created with a unique number."],
    ["Verify follow-on", "Open the follow-on document and confirm the values carried across.", "Verify", "Follow-on document matches the source values."],
    ["Verify audit log", "Check the change log for user, timestamp and reason.", "Verify", "Audit entry recorded for the change."],
  ];
  return base.slice(0, 5 + (variant % 3)).map(([title, instruction, action, expected], i) => ({
    id: `${caseName}-s${i}`.replace(/\s+/g, "-").toLowerCase(),
    stepNo: i + 1,
    title,
    instruction,
    action,
    expected,
  }));
};

export const testCases: TestCase[] = caseSeeds.map(([name, folderId, testingType, priority, application], i) => {
  const key = `TC-${4100 + i * 37}`;
  const versionCount = (i % 3) + 1;
  const versions = Array.from({ length: versionCount }, (_, v) => ({
    id: `${key}-v${v + 1}`,
    version: v + 1,
    createdBy: users[(i + v) % users.length]!.id,
    createdOn: iso(45 - i - v * 6),
    changeNote:
      v === 0
        ? "Initial authoring from process workshop"
        : v === 1
          ? "Added tolerance and audit verification steps"
          : "Reworked release group handling",
    steps: stepTemplate(name, i + v),
  }));
  return {
    id: `tc${i + 1}`,
    orgId: "org1",
    key,
    name,
    description: `Validates ${name.toLowerCase()} end to end, including follow-on document verification.`,
    folderId,
    testingType,
    priority,
    owner: users[i % users.length]!.id,
    application,
    sourceType: i % 5 === 0 ? "Library" : i % 4 === 0 ? "Agent" : "Manual",
    requirementIds: [requirements[i % requirements.length]!.id, requirements[(i + 5) % requirements.length]!.id],
    processIds: [leafProcesses[i % leafProcesses.length]!.id],
    tags: i % 2 === 0 ? ["core", "regression"] : ["core"],
    versions,
    createdOn: iso(45 - i),
  };
});

/* --------------------------------------------------------------- scenarios */

export const testScenarios: TestScenario[] = [
  {
    id: "sc1",
    orgId: "org1",
    key: "SCN-01",
    name: "Procure to Pay — end to end",
    description: "Requisition through purchase order, goods receipt and invoice settlement.",
    owner: "u2",
    members: [
      { testCaseId: "tc2", sequence: 1 },
      { testCaseId: "tc1", sequence: 2 },
      { testCaseId: "tc3", sequence: 3 },
      { testCaseId: "tc4", sequence: 4 },
    ],
  },
  {
    id: "sc2",
    orgId: "org1",
    key: "SCN-02",
    name: "Order to Cash — standard flow",
    description: "Sales order through delivery, goods issue and customer billing.",
    owner: "u5",
    members: [
      { testCaseId: "tc7", sequence: 1 },
      { testCaseId: "tc8", sequence: 2 },
      { testCaseId: "tc9", sequence: 3 },
      { testCaseId: "tc10", sequence: 4 },
    ],
  },
  {
    id: "sc3",
    orgId: "org1",
    key: "SCN-03",
    name: "Financial period close",
    description: "Closing cockpit, allocations and balance carry forward.",
    owner: "u1",
    members: [
      { testCaseId: "tc12", sequence: 1 },
      { testCaseId: "tc13", sequence: 2 },
      { testCaseId: "tc14", sequence: 3 },
    ],
  },
  {
    id: "sc4",
    orgId: "org1",
    key: "SCN-04",
    name: "Integration surface regression",
    description: "Cross-application flows spanning Ariba, ServiceNow and the customer portal.",
    owner: "u5",
    members: [
      { testCaseId: "tc18", sequence: 1 },
      { testCaseId: "tc6", sequence: 2 },
      { testCaseId: "tc17", sequence: 3 },
      { testCaseId: "tc15", sequence: 4 },
    ],
  },
];

/* ------------------------------------------------------------- plans / runs */

export const testPlans: TestPlan[] = [
  {
    id: "pl1",
    projectId: "p1",
    key: "PI-0425",
    name: "Sprint 14 Regression",
    description: "Regression sweep across procurement and finance ahead of the sprint demo.",
    status: "In Progress",
    owner: "u1",
    startDate: iso(9).slice(0, 10),
    endDate: iso(-4).slice(0, 10),
    defaultEnvironment: "dev-sap-04",
    testingType: "Regression",
  },
  {
    id: "pl2",
    projectId: "p1",
    key: "PI-0426",
    name: "UAT Cycle 1",
    description: "Business-led acceptance across order to cash with client stakeholders.",
    status: "In Progress",
    owner: "u1",
    startDate: iso(4).slice(0, 10),
    endDate: iso(-11).slice(0, 10),
    defaultEnvironment: "uat-sap-01",
    testingType: "UAT",
  },
  {
    id: "pl3",
    projectId: "p1",
    key: "PI-0421",
    name: "Integration Cycle 2",
    description: "Cross-application integration validation, completed last sprint.",
    status: "Completed",
    owner: "u5",
    startDate: iso(30).slice(0, 10),
    endDate: iso(16).slice(0, 10),
    defaultEnvironment: "qa-sap-02",
    testingType: "Integration",
  },
];

export const testPlanFolders: TestPlanFolder[] = [
  { id: "pf1", planId: "pl1", name: "Procurement", parentId: null },
  { id: "pf2", planId: "pl1", name: "Finance", parentId: null },
  { id: "pf3", planId: "pl1", name: "Release strategy", parentId: "pf1" },
  { id: "pf4", planId: "pl2", name: "Order capture", parentId: null },
  { id: "pf5", planId: "pl2", name: "Billing", parentId: null },
  { id: "pf6", planId: "pl3", name: "Cross-application", parentId: null },
];

const statusCycle: RunStatus[] = [
  "Passed", "Passed", "Failed", "In Progress", "Passed", "Blocked",
  "Passed", "Not Started", "Passed", "Failed", "Passed", "In Progress",
];

const envs = ["dev-sap-04", "qa-sap-02", "uat-sap-01", "perf-sap-1"];

const runStepsFor = (steps: { title: string; instruction: string; expected: string }[], status: RunStatus): TestRunStep[] =>
  steps.map((s, i) => {
    let stepStatus: StepStatus = "Not Started";
    if (status === "Passed") stepStatus = "Passed";
    else if (status === "Failed") stepStatus = i < steps.length - 1 ? "Passed" : "Failed";
    else if (status === "Blocked") stepStatus = i < 2 ? "Passed" : "Blocked";
    else if (status === "In Progress") stepStatus = i < Math.ceil(steps.length / 2) ? "Passed" : "Not Started";
    return {
      id: `rs-${i}-${Math.random().toString(36).slice(2, 8)}`,
      stepNo: i + 1,
      title: s.title,
      instruction: s.instruction,
      expected: s.expected,
      status: stepStatus,
      actual: stepStatus === "Failed" ? "System raised message M8 534 — tolerance limit exceeded." : undefined,
    };
  });

export const testRuns: TestRun[] = (() => {
  const out: TestRun[] = [];
  const planScope: Record<string, { cases: number[]; folders: (string | null)[] }> = {
    pl1: { cases: [0, 1, 2, 3, 4, 5, 11, 12, 13, 15, 17], folders: ["pf1", "pf3", "pf2"] },
    pl2: { cases: [6, 7, 8, 9, 10, 16], folders: ["pf4", "pf5"] },
    pl3: { cases: [14, 16, 17, 5, 3], folders: ["pf6"] },
  };
  let n = 0;
  Object.entries(planScope).forEach(([planId, scope]) => {
    scope.cases.forEach((caseIdx, i) => {
      const tc = testCases[caseIdx]!;
      const latest = tc.versions[tc.versions.length - 1]!;
      const version = planId === "pl3" ? tc.versions[0]! : latest;
      const status: RunStatus = planId === "pl3" ? (i % 4 === 2 ? "Failed" : "Passed") : statusCycle[(n + i) % statusCycle.length]!;
      n += 1;
      out.push({
        id: `run${n}`,
        projectId: "p1",
        planId,
        folderId: scope.folders[i % scope.folders.length] ?? null,
        key: `RUN-${2400 + n}`,
        sequence: i + 1,
        testCaseId: tc.id,
        versionId: version.id,
        versionNo: version.version,
        assignee: users[(n + 2) % users.length]!.id,
        status,
        priority: tc.priority,
        environment: planId === "pl2" ? "uat-sap-01" : (envs[n % envs.length],
        executedBy: status === "Not Started" ? undefined : users[(n + 2) % users.length]!.id,
        executionStart: status === "Not Started" ? undefined : iso(6 - (n % 5), 8),
        executionEnd: status === "Passed" || status === "Failed" ? iso(6 - (n % 5), 11) : undefined,
        steps: runStepsFor(version.steps, status),
      });
    });
  });
  return out;
})();

/* ----------------------------------------------------------------- defects */

const failedRuns = testRuns.filter((r) => r.status === "Failed" || r.status === "Blocked");

const defectSeeds: [string, string, "Sev 1" | "Sev 2" | "Sev 3" | "Sev 4", Priority, string][] = [
  ["Release strategy skips second approver above 50k", "Purchase orders over the threshold are released after a single approval, bypassing the second release code.", "Sev 1", "Critical", "New"],
  ["Three-way match posts outside 2% tolerance", "Invoice auto-posts even when the price variance is 4.1%.", "Sev 1", "Critical", "In Progress"],
  ["Batch field not captured on goods receipt", "Batch and expiry are not written for batch-managed materials.", "Sev 2", "High", "Triaged"],
  ["Delivery split ignores second shipping point", "All items land on a single delivery regardless of shipping point.", "Sev 2", "High", "In Progress"],
  ["Portal invoice publication delayed by 40 minutes", "Billing PDFs reach the customer portal well outside the 5 minute target.", "Sev 3", "Medium", "New"],
  ["Closing cockpit task owners blank for company code 2000", "Task list renders without owner assignment for the second company code.", "Sev 2", "High", "Resolved"],
  ["Allocation cycle rounds headcount incorrectly", "Assessment cycle rounds fractional headcount down, understating shared cost.", "Sev 3", "Medium", "Triaged"],
  ["Vendor replication drops bank details", "Bank detail segment missing after replication from ServiceNow.", "Sev 2", "High", "Closed"],
  ["Pricing override audit missing reason text", "Reason code is recorded but the free-text justification is dropped.", "Sev 3", "Low", "Rejected"],
  ["Capacity evaluation times out over 10k orders", "Work centre evaluation exceeds 120 seconds on the performance environment.", "Sev 2", "High", "New"],
];

export const defects: Defect[] = defectSeeds.map(([title, description, severity, priority, status], i) => {
  const run = failedRuns[i % Math.max(failedRuns.length, 1)];
  const reportedOn = iso(i < 3 ? 3 : i < 6 ? 6 : 12, 7 + (i % 6));
  const slaRuleId = severity === "Sev 1" ? "sla1" : severity === "Sev 2" ? "sla2" : severity === "Sev 3" ? "sla3" : "sla4";
  return {
    id: `df${i + 1}`,
    projectId: "p1",
    key: `DEF-${2030 + i}`,
    runId: run ? run.id : null,
    title,
    description,
    status: status as Defect["status"],
    severity,
    priority,
    assignee: users[(i + 3) % users.length]!.id,
    reportedBy: users[(i + 1) % users.length]!.id,
    reportedOn,
    slaRuleId,
    respondedOn: i % 3 === 0 ? undefined : iso(i < 3 ? 3 : i < 6 ? 6 : 12, 9 + (i % 4)),
    resolvedOn: status === "Resolved" || status === "Closed" ? iso(2, 15) : undefined,
    comments: [
      { id: `c-${i}-1`, author: users[(i + 1) % users.length]!.id, on: reportedOn, body: "Raised from failed execution; screenshots attached in the run evidence." },
      ...(i % 2 === 0
        ? [{ id: `c-${i}-2`, author: users[(i + 3) % users.length]!.id, on: iso(2, 12), body: "Reproduced in the QA client. Configuration change drafted for review." }]
        : []),
    ],
  };
});
