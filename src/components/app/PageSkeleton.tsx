/** Grey placeholder shaped like a page (title, figures, table) while the plan loads. */
import { Skeleton } from "@/components/ui/skeleton";

const KPI_COUNT = 5;
const ROW_COUNT = 6;

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the plan">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: KPI_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 space-y-2 rounded-xl border p-4">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <Skeleton key={index} className="h-8" />
        ))}
      </div>
    </div>
  );
}
