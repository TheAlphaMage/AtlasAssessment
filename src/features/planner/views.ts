/** The five views of the workspace. They follow the five-step user journey from the brief. */
export const VIEWS = [
  { id: "overview", label: "Overview", step: "Decide" },
  { id: "production", label: "Production", step: "Compare" },
  { id: "commercial", label: "Commercial", step: "Client service" },
  { id: "allocations", label: "Allocations", step: "Trace" },
  { id: "assistant", label: "Assistant", step: "Explain" },
] as const;

export type ViewId = (typeof VIEWS)[number]["id"];

export function findViewByHash(hash: string): ViewId | null {
  const match = VIEWS.find((view) => `#${view.id}` === hash);
  return match ? match.id : null;
}
