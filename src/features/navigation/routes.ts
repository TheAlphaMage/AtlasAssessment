/**
 * Every page of the workspace, in sidebar order. The sidebar, breadcrumb, command menu
 * and the 1-9 keyboard shortcuts all read this list, so a page is added in one place.
 */
import {
  Layers,
  LayoutDashboard,
  ListTree,
  ShieldCheck,
  Sparkles,
  Store,
  Tractor,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

export const ROUTE_GROUPS = ["Today", "Production", "Commercial", "Plan", "Explain", "System"] as const;
export type RouteGroup = (typeof ROUTE_GROUPS)[number];

export interface AppRoute {
  href: string;
  title: string;
  group: RouteGroup;
  icon: LucideIcon;
  /** One line shown under the page title. */
  description: string;
}

export const ROUTES: AppRoute[] = [
  { href: "/overview", title: "Overview", group: "Today", icon: LayoutDashboard, description: "Today's plan at a glance." },
  { href: "/flow", title: "Crop flow", group: "Today", icon: Waypoints, description: "Where every tonne goes, from segment to client." },
  { href: "/farms", title: "Farms", group: "Production", icon: Tractor, description: "Planned versus received, for each farm and segment." },
  { href: "/segments", title: "Segments", group: "Production", icon: Layers, description: "Quality segments A to D: plan, actual and destination." },
  { href: "/clients", title: "Clients", group: "Commercial", icon: Users, description: "Orders in serving order, highest price first." },
  { href: "/allocations", title: "Allocations", group: "Plan", icon: ListTree, description: "Every exported tonne, traced to farm, segment and client." },
  { href: "/local-market", title: "Local market", group: "Plan", icon: Store, description: "Fruit that cannot be exported today, and what it is worth." },
  { href: "/assistant", title: "Assistant", group: "Explain", icon: Sparkles, description: "Ask questions about the computed plan." },
  { href: "/data-health", title: "Data health", group: "System", icon: ShieldCheck, description: "Workbook validation, plan checks and the planning policy." },
];

export function findRoute(pathname: string): AppRoute | undefined {
  return ROUTES.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`));
}

export function routesInGroup(group: RouteGroup): AppRoute[] {
  return ROUTES.filter((route) => route.group === group);
}
