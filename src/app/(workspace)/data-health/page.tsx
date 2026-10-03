import type { Metadata } from "next";
import { DataHealthPage } from "@/features/data-health/DataHealthPage";

export const metadata: Metadata = { title: "Data health" };

export default function Page() {
  return <DataHealthPage />;
}
