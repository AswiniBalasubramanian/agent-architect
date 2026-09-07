/**
 * Assistant helpers. The prototype runs without a backend, so these produce
 * deterministic, domain-shaped output on a simulated latency curve — including
 * the intermediate "thinking" phases the real agent would stream.
 */

export type AiPhase = "idle" | "reading" | "drafting" | "checking" | "done" | "error";

export const phaseLabel: Record<AiPhase, string> = {
  idle: "Ready",
  reading: "Reading context…",
  drafting: "Drafting…",
  checking: "Checking against governance rules…",
  done: "Ready",
  error: "Could not complete",
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Runs the phase sequence, reporting each phase, then resolves the payload. */
export async function runWithPhases<T>(
  onPhase: (phase: AiPhase) => void,
  produce: () => T,
  speed = 1,
): Promise<T> {
  onPhase("reading");
  await wait(450 * speed);
  onPhase("drafting");
  await wait(700 * speed);
  onPhase("checking");
  await wait(400 * speed);
  const result = produce();
  onPhase("done");
  return result;
}

export interface DraftStep {
  title: string;
  instruction: string;
  action: string;
  expected: string;
}

export function draftSteps(caseName: string, application: string, testingType: string): DraftStep[] {
  const subject = caseName.toLowerCase();
  const steps: DraftStep[] = [
    {
      title: "Prepare test data",
      instruction: `Confirm the master data required for ${subject} exists in ${application} and note the identifiers.`,
      action: "Verify",
      expected: "All referenced master data is active and available in the test environment.",
    },
    {
      title: "Open the transaction",
      instruction: `Launch the ${application} app used for ${subject}.`,
      action: "Navigate",
      expected: "Entry screen opens against the correct company code and environment.",
    },
    {
      title: "Enter header details",
      instruction: "Populate mandatory header fields from the test data sheet.",
      action: "Type",
      expected: "No mandatory-field errors are raised.",
    },
    {
      title: "Enter item details",
      instruction: "Add line items with quantity, plant and pricing as per the scenario.",
      action: "Type",
      expected: "Items are accepted and the net value recalculates.",
    },
    {
      title: "Trigger the business rule",
      instruction: `Execute the check or release step that ${subject} is validating.`,
      action: "Click",
      expected: "The system applies the configured rule and reports the outcome.",
    },
    {
      title: "Save and capture the document",
      instruction: "Save the document and record the generated number as evidence.",
      action: "Click",
      expected: "Document is created with a unique number and no error message.",
    },
    {
      title: "Verify the follow-on document",
      instruction: "Open the follow-on document and confirm values carried across correctly.",
      action: "Verify",
      expected: "Follow-on values match the source document.",
    },
    {
      title: "Verify the audit trail",
      instruction: "Check the change log for user, timestamp and reason.",
      action: "Verify",
      expected: "An audit entry exists for every change made during the test.",
    },
  ];
  if (testingType === "Performance") {
    steps.push({
      title: "Measure response time",
      instruction: "Repeat the transaction with the agreed data volume and record response times.",
      action: "Verify",
      expected: "Response time stays inside the agreed threshold for the full volume.",
    });
  }
  if (testingType === "UAT") return steps.filter((_, i) => i !== 0 && i !== 7);
  return steps.slice(0, testingType === "Regression" ? 7 : 6);
}

export interface DraftCase {
  name: string;
  testingType: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  rationale: string;
}

export function draftCasesForRequirement(requirementName: string, priority: string): DraftCase[] {
  const stem = requirementName.replace(/\.$/, "");
  const sev = (priority === "Critical" || priority === "High" ? "High" : "Medium") as DraftCase["priority"];
  return [
    {
      name: `${stem} — happy path`,
      testingType: "Regression",
      priority: sev,
      rationale: "Covers the primary flow described by the requirement.",
    },
    {
      name: `${stem} — boundary and tolerance`,
      testingType: "Regression",
      priority: sev,
      rationale: "Exercises the threshold values where the rule is most likely to fail.",
    },
    {
      name: `${stem} — negative / rejection`,
      testingType: "Integration",
      priority: "Medium",
      rationale: "Confirms the system blocks the invalid case instead of posting silently.",
    },
    {
      name: `${stem} — audit trail`,
      testingType: "Regression",
      priority: "Medium",
      rationale: "Verifies the change log captures user, timestamp and reason for compliance.",
    },
  ];
}

export interface TriageSuggestion {
  severity: "Critical" | "High" | "Medium" | "Low";
  area: string;
  summary: string;
  nextAction: string;
  duplicates: string[];
}

export function triageDefect(input: {
  title: string;
  description: string;
  currentSeverity: string;
  siblings: { key: string; title: string }[];
}): TriageSuggestion {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const severity: TriageSuggestion["severity"] = /bypass|blocker|corrupt|data loss|posts outside|skips/.test(text)
    ? "Critical"
    : /incorrect|missing|not captured|fails|times out/.test(text)
      ? "High"
      : /delay|slow|rounds|cosmetic|label/.test(text)
        ? "Medium"
        : "Low";
  const area = /invoice|billing|tax|posting|ledger/.test(text)
    ? "Finance posting"
    : /purchase|requisition|release|supplier|vendor/.test(text)
      ? "Procurement"
      : /delivery|shipping|sales|order/.test(text)
        ? "Order to cash"
        : /portal|screen|ui|mobile/.test(text)
          ? "User interface"
          : "Cross-application";
  const words = input.title.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
  const duplicates = input.siblings
    .filter((s) => words.some((w) => s.title.toLowerCase().includes(w)))
    .slice(0, 3)
    .map((s) => `${s.key} · ${s.title}`);
  return {
    severity,
    area,
    summary: `${area} issue: ${input.title.replace(/\.$/, "")}. Behaviour deviates from the expected result recorded on the failing step.`,
    nextAction:
      severity === "Critical"
        ? "Assign to the configuration owner today and flag on the daily defect call."
        : severity === "High"
          ? "Triage within the response window and confirm reproduction steps with the tester."
          : "Batch into the next triage session; no escalation needed yet.",
    duplicates,
  };
}

export function executionSummary(input: {
  passed: number;
  failed: number;
  blocked: number;
  inProgress: number;
  notStarted: number;
  breached: number;
  planNames: string[];
}): string[] {
  const executed = input.passed + input.failed;
  const rate = executed ? Math.round((input.passed / executed) * 100) : 0;
  const lines = [
    `${executed} of ${executed + input.inProgress + input.notStarted + input.blocked} runs are executed at a ${rate}% pass rate.`,
  ];
  if (input.failed) lines.push(`${input.failed} failing run${input.failed > 1 ? "s" : ""} concentrate in ${input.planNames[0] ?? "the active plan"} — review before the next cycle closes.`);
  if (input.blocked) lines.push(`${input.blocked} run${input.blocked > 1 ? "s are" : " is"} blocked and will not progress without environment or data support.`);
  if (input.breached) lines.push(`${input.breached} defect${input.breached > 1 ? "s have" : " has"} breached its SLA and needs escalation now.`);
  if (input.notStarted) lines.push(`${input.notStarted} run${input.notStarted > 1 ? "s have" : " has"} not started — confirm assignees have environment access.`);
  if (lines.length === 1) lines.push("No failures, blocks or SLA breaches in scope. Execution is on track.");
  return lines;
}
