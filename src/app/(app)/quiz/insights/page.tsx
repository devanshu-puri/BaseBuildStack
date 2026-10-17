import { InsightsClient } from "./insights-client";

export const metadata = {
  title: "Interview Readiness Insights | Module II",
  description:
    "Deterministic 3-score evaluation measuring stack knowledge, live practical debugging, and project defense readiness.",
};

export default function InsightsPage() {
  return <InsightsClient />;
}
