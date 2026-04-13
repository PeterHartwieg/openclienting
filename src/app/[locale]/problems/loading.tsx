import { Skeleton } from "@/components/ui/skeleton";
import { ProblemCardSkeleton } from "@/components/problems/problem-card-skeleton";

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-4 h-10 w-full max-w-xl rounded-md" />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar skeleton */}
        <div className="w-full shrink-0 lg:w-64">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-4 w-20" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-20 rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card grid skeleton */}
        <div className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProblemCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
