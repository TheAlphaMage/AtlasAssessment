/** A row of small labelled figures at the top of a drawer. */
import type { ReactNode } from "react";

export interface DrawerStat {
  label: string;
  value: ReactNode;
}

export function DrawerStats({ stats }: { stats: DrawerStat[] }) {
  return (
    <dl className="grid grid-cols-4 divide-x rounded-lg border">
      {stats.map((stat) => (
        <div key={stat.label} className="px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="mt-0.5 font-semibold whitespace-nowrap tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
