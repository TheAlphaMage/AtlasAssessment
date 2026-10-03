/** The frame shared by every detail drawer: header, scrolling body and a footer with actions. */
import type { ReactNode } from "react";
import { SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface DrawerLayoutProps {
  eyebrow: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function DrawerLayout({ eyebrow, title, description, badge, footer, children }: DrawerLayoutProps) {
  return (
    <>
      <SheetHeader className="gap-1 border-b px-6 py-5">
        <p className="text-xs font-medium text-muted-foreground">{eyebrow}</p>
        <div className="flex items-center gap-3 pr-8">
          <SheetTitle className="text-lg font-semibold tracking-tight">{title}</SheetTitle>
          {badge}
        </div>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
      {footer && <SheetFooter className="flex-row items-center justify-between border-t px-6 py-4">{footer}</SheetFooter>}
    </>
  );
}

/** A titled block inside a drawer. */
export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}
