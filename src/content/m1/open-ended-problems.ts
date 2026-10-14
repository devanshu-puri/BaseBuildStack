import { OpenEndedDrill, OpenEndedDrillSchema } from "./open-ended-schema";
export type { OpenEndedDrill, DrillPushbackNode } from "./open-ended-schema";
import { OPEN_ENDED_DRILLS } from "./open-ended-data";

// Validate all seeded open-ended drills at runtime boundary
export const ALL_OPEN_ENDED_DRILLS: OpenEndedDrill[] = OPEN_ENDED_DRILLS.map((d) =>
  OpenEndedDrillSchema.parse(d)
);

export function getOpenEndedDrillById(id: string): OpenEndedDrill | undefined {
  return ALL_OPEN_ENDED_DRILLS.find((d) => d.id === id);
}

export function getOpenEndedCategories(): string[] {
  const categories = new Set(ALL_OPEN_ENDED_DRILLS.map((d) => d.category));
  return Array.from(categories);
}

export function getPushbackNode(
  drill: OpenEndedDrill,
  phase2ChoiceIndex: number
) {
  const match = drill.phase3Branches.find(
    (b) => b.phase2ChoiceIndex === phase2ChoiceIndex
  );
  return match || drill.phase3Branches[0];
}
