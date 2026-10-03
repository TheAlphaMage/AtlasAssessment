import type { Metadata } from "next";
import { LocalMarketPage } from "@/features/local-market/LocalMarketPage";

export const metadata: Metadata = { title: "Local market" };

export default function Page() {
  return <LocalMarketPage />;
}
