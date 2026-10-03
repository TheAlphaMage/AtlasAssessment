import type { Metadata } from "next";
import { SegmentsPage } from "@/features/segments/SegmentsPage";

export const metadata: Metadata = { title: "Segments" };

export default function Page() {
  return <SegmentsPage />;
}
