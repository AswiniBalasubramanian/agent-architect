import type { ID } from "./types";

export type IntegrationStatus = "Connected" | "Not connected" | "Error";
export type IntegrationDirection = "Import" | "Import / Sync" | "Push";

export interface Integration {
  id: ID;
  name: string;
  vendor: string;
  purpose: string;
  entities: string[];
  direction: IntegrationDirection;
  status: IntegrationStatus;
  lastSync?: string | undefined;
  recordCount?: number | undefined;
}

export const integrations: Integration[] = [
  {
    id: "int-qtest",
    name: "qTest",
    vendor: "Tricentis",
    purpose: "Migrate existing qTest projects, modules and test cases into the master repository.",
    entities: ["Test Case", "Test Case Folder", "Test Run"],
    direction: "Import / Sync",
    status: "Connected",
    lastSync: "2026-09-06T18:20:00Z",
    recordCount: 1284,
  },
  {
    id: "int-tosca",
    name: "Tosca",
    vendor: "Tricentis",
    purpose: "Trigger automated Tosca execution from a test plan and read results back onto runs.",
    entities: ["Test Run", "Test Run Step"],
    direction: "Push",
    status: "Connected",
    lastSync: "2026-09-07T06:05:00Z",
    recordCount: 312,
  },
  {
    id: "int-solman",
    name: "SAP Solution Manager",
    vendor: "SAP",
    purpose: "Import the process hierarchy and existing test documents from SolDoc.",
    entities: ["Business Process", "Test Case"],
    direction: "Import",
    status: "Connected",
    lastSync: "2026-09-01T09:40:00Z",
    recordCount: 640,
  },
  {
    id: "int-calm",
    name: "SAP Cloud ALM",
    vendor: "SAP",
    purpose: "Sync scope items, requirements and defect status with Cloud ALM.",
    entities: ["Requirement", "Defect"],
    direction: "Import / Sync",
    status: "Not connected",
  },
  {
    id: "int-jira",
    name: "Jira",
    vendor: "Atlassian",
    purpose: "Mirror defects into the delivery backlog and keep status in step.",
    entities: ["Defect"],
    direction: "Import / Sync",
    status: "Error",
    lastSync: "2026-09-05T11:12:00Z",
    recordCount: 96,
  },
  {
    id: "int-signavio",
    name: "Signavio",
    vendor: "SAP",
    purpose: "Import modelled process hierarchies for non-SAP and hybrid landscapes.",
    entities: ["Business Process"],
    direction: "Import",
    status: "Not connected",
  },
];
