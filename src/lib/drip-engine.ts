/**
 * Database-driven drip campaign engine
 *
 * Unlike the hardcoded DRIP_SEQUENCE in dr casp, this evaluates
 * sequence steps from the database, allowing users to create and modify
 * sequences without code changes.
 */

export type EmailCondition =
  | { type: "always" }
  | { type: "not_opened"; step_number: number }
  | { type: "clicked"; step_number: number }
  | { type: "clicked_no_buy"; step_numbers: number[] }
  | { type: "any_opened" };

export interface SequenceStep {
  id: string;
  step_number: number;
  day_offset: number;
  subject: string;
  html_body: string;
  step_key?: string;
  email_type: string;
  condition?: EmailCondition | Record<string, unknown>;
}

export interface EmailLog {
  step_number: number;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
}

function checkCondition(
  condition: EmailCondition | Record<string, unknown> | undefined,
  logs: EmailLog[]
): boolean {
  if (!condition || typeof condition !== "object") return true;

  const c = condition as Record<string, unknown>;
  const type = c.type as string | undefined;

  switch (type) {
    case "always":
      return true;

    case "not_opened": {
      const stepNumber = c.step_number as number | undefined;
      if (!stepNumber) return false;
      const log = logs.find((l) => l.step_number === stepNumber);
      if (!log) return false;
      return log.status !== "opened" && !log.opened_at;
    }

    case "clicked": {
      const stepNumber = c.step_number as number | undefined;
      if (!stepNumber) return false;
      const log = logs.find((l) => l.step_number === stepNumber);
      return !!(log && (log.status === "clicked" || log.clicked_at));
    }

    case "clicked_no_buy": {
      const stepNumbers = c.step_numbers as number[] | undefined;
      if (!stepNumbers || !Array.isArray(stepNumbers)) return false;
      return stepNumbers.some((sn) => {
        const log = logs.find((l) => l.step_number === sn);
        return log && (log.status === "clicked" || log.clicked_at);
      });
    }

    case "any_opened":
      return logs.some((l) => l.status === "opened" || l.opened_at);

    default:
      return true;
  }
}

/**
 * Determine which sequence step a lead should receive next
 */
export function getStepDueForLead(
  enrolledDate: Date,
  sentLogs: EmailLog[],
  steps: SequenceStep[]
): SequenceStep | null {
  const sentStepNumbers = sentLogs.map((l) => l.step_number);
  const now = new Date();
  const daysSinceEnrollment = Math.floor(
    (now.getTime() - enrolledDate.getTime()) / 86400000
  );

  // Sort by day_offset so earlier steps always take priority
  const sorted = [...steps].sort((a, b) => a.day_offset - b.day_offset);

  for (const step of sorted) {
    // Skip if already sent
    if (sentStepNumbers.includes(step.step_number)) continue;

    // Skip if not yet due
    if (step.day_offset > daysSinceEnrollment) continue;

    // Check condition
    if (!checkCondition(step.condition, sentLogs)) continue;

    return step;
  }

  return null;
}
