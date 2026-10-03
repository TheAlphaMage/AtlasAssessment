import type { Metadata } from "next";
import { AssistantPage } from "@/features/assistant/AssistantPage";

export const metadata: Metadata = { title: "Assistant" };

export default function Page() {
  return <AssistantPage />;
}
