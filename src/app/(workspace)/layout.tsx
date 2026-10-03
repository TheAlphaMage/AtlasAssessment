/**
 * The workspace shell shared by every page: sidebar, header, global banner, the detail drawer and ⌘K menu.
 * The plan is loaded once here (PlanProvider) and stays loaded while moving between pages.
 */
import { Suspense, ViewTransition, type ReactNode } from "react";
import { AppHeader } from "@/components/app/AppHeader";
import { AppSidebar } from "@/components/app/AppSidebar";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { SidebarAutoCollapse } from "@/components/app/SidebarAutoCollapse";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CommandMenu } from "@/features/command/CommandMenu";
import { CommandMenuProvider } from "@/features/command/CommandMenuContext";
import { EntityDrawerHost } from "@/features/drawers/EntityDrawerHost";
import { HighlightProvider } from "@/features/entities/HighlightContext";
import { WorkspaceHotkeys } from "@/features/navigation/WorkspaceHotkeys";
import { PlanGate } from "@/features/plan/PlanGate";
import { PlanProvider } from "@/features/plan/PlanProvider";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <PlanProvider>
      <CommandMenuProvider>
        <HighlightProvider>
          <SidebarProvider>
            <SidebarAutoCollapse />
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              <div className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6 xl:px-8">
                <PlanGate>
                  <Suspense fallback={<PageSkeleton />}>
                    <ViewTransition>{children}</ViewTransition>
                  </Suspense>
                </PlanGate>
              </div>
            </SidebarInset>
            {/* Both read the URL (useSearchParams), which Next.js requires to sit inside <Suspense>. */}
            <Suspense fallback={null}>
              <EntityDrawerHost />
              <CommandMenu />
            </Suspense>
            <WorkspaceHotkeys />
          </SidebarProvider>
        </HighlightProvider>
      </CommandMenuProvider>
    </PlanProvider>
  );
}
