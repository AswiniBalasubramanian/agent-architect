export type ID = string;

export type RunStatus = "Not Started" | "In Progress" | "Passed" | "Failed" | "Blocked";
export type StepStatus = "Not Started" | "Passed" | "Failed" | "Blocked";
export type DefectStatus = "New" | "Triaged" | "In Progress" | "Resolved" | "Closed" | "Rejected";
export type Severity = "Sev 1" | "Sev 2" | "Sev 3" | "Sev 4";
export type Priority = "Critical" | "High" | "Medium" | "Low";

export interface AppUser {
  id: ID;
  name: string;
  initials: string;
  role:
    | "Admin"
    | "Functional Consultant"
    | "Test Manager"
    | "Tester"
    | "Client Stakeholder"
    | "Leadership";
}

export interface Organization {
  id: ID;
  name: string;
  industry: string;
}

export interface Project {
  id: ID;
  orgId: ID;
  name: string;
  kind: "SAP" | "Non-SAP";
  phase: string;
}

export interface ConfigValue {
  id: ID;
  group: string;
  value: string;
  order: number;
  active: boolean;
  system?: boolean | undefined;
}

export interface CustomField {
  id: ID;
  entity: string;
  label: string;
  type: "Text" | "Picklist" | "Number" | "Date" | "Checkbox";
  required: boolean;
  active: boolean;
}

export interface SlaRule {
  id: ID;
  name: string;
  appliesTo: string;
  condition: string;
  responseHours: number;
  resolutionHours: number;
  active: boolean;
}

export interface NotificationRule {
  id: ID;
  name: string;
  trigger: string;
  cadence: "Immediate" | "Daily Recurring" | "Weekly";
  recipients: string;
  active: boolean;
}

export interface BusinessProcess {
  id: ID;
  orgId: ID;
  name: string;
  parentId: ID | null;
  levelType: string;
  application: string;
  sourceType: "Manual" | "Integration" | "Agent";
  integrationSource?: string | undefined;
  owner?: ID | undefined;
  description?: string | undefined;
  tags: string[];
  createdBy: ID;
  createdOn: string;
}

export interface Requirement {
  id: ID;
  orgId: ID;
  name: string;
  description: string;
  status: string;
  priority: Priority;
  owner: ID;
  processIds: ID[];
  sourceType: "Manual" | "Document" | "Integration" | "Agent";
  tags: string[];
  createdOn: string;
}

export interface TestStep {
  id: ID;
  stepNo: number;
  title: string;
  instruction: string;
  action?: string | undefined;
  expected: string;
}

export interface TestCaseVersion {
  id: ID;
  version: number;
  createdBy: ID;
  createdOn: string;
  changeNote: string;
  steps: TestStep[];
}

export interface TestCaseFolder {
  id: ID;
  orgId: ID;
  name: string;
  parentId: ID | null;
}

export interface TestCase {
  id: ID;
  orgId: ID;
  key: string;
  name: string;
  description: string;
  folderId: ID;
  testingType: string;
  priority: Priority;
  owner: ID;
  application: string;
  sourceType: "Manual" | "Import" | "Agent" | "Library";
  requirementIds: ID[];
  processIds: ID[];
  tags: string[];
  versions: TestCaseVersion[];
  createdOn: string;
}

export interface TestScenario {
  id: ID;
  orgId: ID;
  key: string;
  name: string;
  description: string;
  owner: ID;
  members: { testCaseId: ID; sequence: number }[];
}

export interface TestPlanFolder {
  id: ID;
  planId: ID;
  name: string;
  parentId: ID | null;
}

export interface TestPlan {
  id: ID;
  projectId: ID;
  key: string;
  name: string;
  description: string;
  status: "Planned" | "In Progress" | "Completed" | "On Hold";
  owner: ID;
  startDate: string;
  endDate: string;
  defaultEnvironment: string;
  testingType: string;
}

export interface TestRunStep {
  id: ID;
  stepNo: number;
  title: string;
  instruction: string;
  expected: string;
  status: StepStatus;
  actual?: string | undefined;
  evidence?: string | undefined;
}

export interface TestRun {
  id: ID;
  projectId: ID;
  planId: ID;
  folderId: ID | null;
  key: string;
  sequence: number;
  testCaseId: ID;
  versionId: ID;
  versionNo: number;
  assignee: ID;
  status: RunStatus;
  priority: Priority;
  environment: string;
  executedBy?: ID | undefined;
  executionStart?: string | undefined;
  executionEnd?: string | undefined;
  steps: TestRunStep[];
}

export interface Defect {
  id: ID;
  projectId: ID;
  key: string;
  runId: ID | null;
  title: string;
  description: string;
  status: DefectStatus;
  severity: Severity;
  priority: Priority;
  assignee: ID;
  reportedBy: ID;
  reportedOn: string;
  slaRuleId: ID;
  respondedOn?: string | undefined;
  resolvedOn?: string | undefined;
  comments: { id: ID; author: ID; on: string; body: string }[];
}
