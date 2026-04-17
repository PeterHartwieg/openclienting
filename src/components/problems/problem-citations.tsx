import { ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/i18n/format";
import type { ContentCitation } from "@/lib/queries/problems";

interface ProblemCitationsProps {
  citations: ContentCitation[];
  locale: string;
}

export function ProblemCitations({ citations, locale }: ProblemCitationsProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-6">
      <Separator className="mb-6" />
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground select-none">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Sources ({citations.length})
        </summary>
        <ol className="mt-4 space-y-3 pl-4">
          {citations.map((c, i) => (
            <li key={c.source_url} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 shrink-0 text-muted-foreground">{i + 1}.</span>
              <div className="min-w-0">
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {c.source_title ?? c.source_url}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {(c.publisher || c.access_date) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.publisher}
                    {c.publisher && c.access_date && " · "}
                    {c.access_date && formatDate(c.access_date, locale, "short")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
