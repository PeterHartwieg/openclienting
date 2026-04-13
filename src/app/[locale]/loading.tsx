import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero skeleton */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Skeleton className="mx-auto h-14 w-96 max-w-full" />
          <Skeleton className="mx-auto mt-6 h-6 w-80 max-w-full" />
          <Skeleton className="mx-auto mt-8 h-10 w-96 max-w-full rounded-md" />
          <div className="mt-6 flex justify-center gap-4">
            <Skeleton className="h-11 w-36 rounded-md" />
            <Skeleton className="h-11 w-40 rounded-md" />
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="border-y py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-12" />
                <Skeleton className="mt-1 h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
