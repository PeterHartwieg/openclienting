import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListSchema, type BreadcrumbItem } from "@/lib/seo/schema";
import { getSiteUrl } from "@/lib/site";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Visible breadcrumb trail + matching BreadcrumbList JSON-LD. The trail names
 * shown to the user are the same strings used in the schema — no hidden items.
 *
 * `items[].url` must be locale-prefixed site-root paths (e.g. `/en/problems`).
 * The component resolves them to absolute URLs for the schema but renders
 * relative paths to the visible <Link>s.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const absoluteItems = items.map((item) => ({
    name: item.name,
    url: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
  }));

  return (
    <>
      <JsonLd data={breadcrumbListSchema(absoluteItems)} />
      <nav
        aria-label="Breadcrumb"
        className={className ?? "text-sm text-muted-foreground"}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={item.url} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
                )}
                {isLast ? (
                  <span className="text-foreground" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.url} className="hover:text-foreground transition-colors">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
