import type { Metadata } from "next";
import { FarmsPage } from "@/features/farms/FarmsPage";

export const metadata: Metadata = { title: "Farms" };

export default function Page() {
  return <FarmsPage />;
}
