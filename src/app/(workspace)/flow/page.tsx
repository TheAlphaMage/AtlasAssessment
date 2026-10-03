import type { Metadata } from "next";
import { FlowPage } from "@/features/flow/FlowPage";

export const metadata: Metadata = { title: "Crop flow" };

export default function Page() {
  return <FlowPage />;
}
