import type { Segment } from "@/lib/domain/types";

/** One farm, client or segment the user is pointing at. Fields are optional so a filter can combine them. */
export interface Selection {
  clientId?: string;
  farmId?: string;
  segment?: Segment;
}
