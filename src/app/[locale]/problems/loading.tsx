import { Skeleton } from "@/components/ui/skeleton";

export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-10 w-full max-w-xl mb-8" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <Skeleton className="h-64 w-full lg:w-64" />
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
