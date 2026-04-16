import { Skeleton } from "@/components/ui/skeleton";

export default function ProblemDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-3/4 mb-2" />
      <Skeleton className="h-4 w-48 mb-4" />
      <div className="flex gap-2 mb-8">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-32 w-full mb-8" />
      <Skeleton className="h-24 w-full mb-8" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
