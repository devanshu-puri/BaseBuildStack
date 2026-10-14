import { BugAuditProblem, BugAuditProblemSchema } from "./bug-audit-schema";
export type { BugAuditProblem } from "./bug-audit-schema";
import { BUG_AUDIT_PROBLEMS } from "./bug-audit-data";

// Strictly validate every seeded Bug Audit problem at runtime boundary
export const ALL_BUG_AUDIT_PROBLEMS: BugAuditProblem[] = BUG_AUDIT_PROBLEMS.map((p) =>
  BugAuditProblemSchema.parse(p)
);

export function getBugAuditProblemById(id: string): BugAuditProblem | undefined {
  return ALL_BUG_AUDIT_PROBLEMS.find((p) => p.id === id);
}

export function getBugAuditCategories(): string[] {
  const categories = new Set(ALL_BUG_AUDIT_PROBLEMS.map((p) => p.category));
  return Array.from(categories);
}
