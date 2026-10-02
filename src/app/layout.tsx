import type { Metadata } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/print.css";
import { THEME_INIT_SCRIPT } from "./themeInitScript";

export const metadata: Metadata = {
  title: "Atlas Fresh · Daily Export Planner",
  description: "Production–Commercial daily export planning workspace (decision support).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script changes <html data-theme> before React starts.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
