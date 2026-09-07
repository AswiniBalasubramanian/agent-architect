import type { AppUser, ID } from "./types";
import { users } from "./seed";

export type PersonaId =
  | "admin"
  | "functional"
  | "manager"
  | "tester"
  | "client"
  | "leadership";

export type Capability =
  | "authorMaster"
  | "governRepository"
  | "managePlans"
  | "execute"
  | "raiseDefect"
  | "triageDefect"
  | "administer"
  | "useAi";

export interface Persona {
  id: PersonaId;
  label: string;
  short: string;
  userId: ID;
  summary: string;
  /** Pages this persona can open, by route path. */
  routes: string[];
  capabilities: Capability[];
  /** Dashboard framing for this persona. */
  focus: "delivery" | "authoring" | "execution" | "readonly" | "governance";
  landing: string;
}

export const personas: Persona[] = [
  {
    id: "manager",
    label: "Test Manager / Lead",
    short: "Test Manager",
    userId: "u1",
    summary: "Owns test plans, pulls existing content into a plan, tracks execution and SLA.",
    routes: ["/", "/processes", "/requirements", "/test-cases", "/scenarios", "/plans", "/runs", "/defects", "/insights", "/reports"],
    capabilities: ["managePlans", "triageDefect", "raiseDefect", "useAi"],
    focus: "delivery",
    landing: "/",
  },
  {
    id: "functional",
    label: "Functional Consultant",
    short: "Consultant",
    userId: "u2",
    summary: "Maps business processes, authors requirements and maintains master test cases.",
    routes: ["/", "/processes", "/requirements", "/test-cases", "/scenarios", "/defects"],
    capabilities: ["authorMaster", "raiseDefect", "useAi"],
    focus: "authoring",
    landing: "/processes",
  },
  {
    id: "tester",
    label: "Tester",
    short: "Tester",
    userId: "u3",
    summary: "Executes assigned runs, records step results and raises defects.",
    routes: ["/", "/test-cases", "/runs", "/defects"],
    capabilities: ["execute", "raiseDefect", "useAi"],
    focus: "execution",
    landing: "/runs",
  },
  {
    id: "admin",
    label: "Admin",
    short: "Admin",
    userId: "u7",
    summary: "Governs picklists, custom fields, SLA and notification rules and integrations.",
    routes: ["/", "/processes", "/requirements", "/test-cases", "/scenarios", "/plans", "/runs", "/defects", "/insights", "/reports", "/admin"],
    capabilities: ["administer", "governRepository", "authorMaster", "managePlans", "triageDefect", "raiseDefect", "useAi"],
    focus: "governance",
    landing: "/admin",
  },
  {
    id: "client",
    label: "Client Stakeholder",
    short: "Stakeholder",
    userId: "u8",
    summary: "Participates in UAT execution and reviews progress. No master content authoring.",
    routes: ["/", "/runs", "/defects", "/insights"],
    capabilities: ["execute", "raiseDefect"],
    focus: "execution",
    landing: "/",
  },
  {
    id: "leadership",
    label: "Leadership",
    short: "Leadership",
    userId: "u9",
    summary: "Read-only dashboards and reporting across the programme.",
    routes: ["/", "/insights", "/reports", "/plans", "/runs", "/defects"],
    capabilities: [],
    focus: "readonly",
    landing: "/insights",
  },
];

export const personaById = (id: PersonaId): Persona =>
  personas.find((p) => p.id === id) ?? personas[0]!;

export const personaUser = (id: PersonaId): AppUser => {
  const persona = personaById(id);
  return users.find((u) => u.id === persona.userId) ?? users[0]!;
};

export const personaCan = (id: PersonaId, capability: Capability) =>
  personaById(id).capabilities.includes(capability);

export const personaSeesRoute = (id: PersonaId, route: string) =>
  personaById(id).routes.includes(route);
