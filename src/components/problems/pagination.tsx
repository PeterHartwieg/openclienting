import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProblemsPaginationProps {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  labels: {
    previous: string;
    next: string;
    page: string;
    of: string;
  };
}

/**
 * Server-rendered pagination bar for the problems browse page. Preserves
 * every existing search param (filters, query text, solution status) and
 * only updates `page`. Uses `buttonVariants` + `next/link` per the
 * project's shadcn v4 convention (no `asChild`).
 */
export function ProblemsPagination({
  page,
  total,
  pageSize,
  basePath,
  searchParams,
  labels,
}: ProblemsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);

  function hrefForPage(p: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v);
      } else {
        params.set(key, value);
      }
    }
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= totalPages;

  return (
    <nav
      className="mt-8 flex items-center justify-between border-t pt-6"
      aria-label={labels.page}
    >
      <Link
        href={prevDisabled ? "#" : hrefForPage(safePage - 1)}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          prevDisabled && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        {labels.previous}
      </Link>

      <span className="text-sm text-muted-foreground">
        {labels.page} {safePage} {labels.of} {totalPages}
      </span>

      <Link
        href={nextDisabled ? "#" : hrefForPage(safePage + 1)}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          nextDisabled && "pointer-events-none opacity-40",
        )}
      >
        {labels.next}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Link>
    </nav>
  );
}
