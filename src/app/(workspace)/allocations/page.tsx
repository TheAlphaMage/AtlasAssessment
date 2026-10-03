import type { Metadata } from "next";
import { AllocationsPage } from "@/features/allocations/AllocationsPage";

export const metadata: Metadata = { title: "Allocations" };

export default function Page() {
  return <AllocationsPage />;
}
