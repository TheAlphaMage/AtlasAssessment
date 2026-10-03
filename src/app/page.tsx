import { redirect } from "next/navigation";

/** The workspace starts on the Overview. */
export default function Home() {
  redirect("/overview");
}
