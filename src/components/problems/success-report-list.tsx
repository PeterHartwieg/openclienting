import {
  CalendarRange,
  Users,
  Shield,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SuccessReport {
  id: string;
  report_summary: string;
  pilot_date_range?: string | null;
  deployment_scope?: string | null;
  kpi_summary?: string | null;
  evidence_notes?: string | null;
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean;
  verification_status?: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
  organizations?: { id: string; name: string } | null;
}

interface SuccessReportListProps {
  reports: SuccessReport[];
}

export function SuccessReportList({ reports }: SuccessReportListProps) {
  if (reports.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
          Pilot Results ({reports.length})
        </p>
      </div>
      {reports.map((report) => (
        <SuccessReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

function SuccessReportCard({ report }: { report: SuccessReport }) {
  const isVerified = report.verification_status === "verified";

  const authorLabel = report.is_publicly_anonymous
    ? "Anonymous"
    : report.profiles?.display_name ?? "Unknown";
  const orgLabel = report.is_org_anonymous
    ? null
    : report.organizations?.name ?? null;
  // Use a Unicode escape for the middle dot so the source stays pure ASCII
  // and the separator can't be mangled by tools that mis-detect file encoding.
  const attribution = [authorLabel, orgLabel].filter(Boolean).join(" \u00B7 ");

  const kpiItems = parseKpis(report.kpi_summary);

  const formattedDate = new Date(report.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${
        isVerified
          ? "border-green-500/30 bg-gradient-to-br from-green-500/[0.08] via-green-500/[0.03] to-transparent"
          : "border-border bg-card"
      }`}
    >
      {isVerified && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
      )}

      {/* Header: status seal */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <>
              <div className="rounded-full bg-green-500/15 p-1.5">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                Verified Pilot Result
              </span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-1.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {report.verification_status === "under_review"
                  ? "Under Review"
                  : "Reported Result"}
              </span>
            </>
          )}
        </div>
        {!isVerified && report.verification_status === "under_review" && (
          <Badge variant="outline" className="text-yellow-600 dark:text-yellow-500 border-yellow-500/40">
            <Clock className="mr-1 h-3 w-3" /> Pending verification
          </Badge>
        )}
      </div>

      {/* Headline quote */}
      <blockquote className="mt-3 border-l-2 border-green-500/50 px-5 py-1 text-base font-medium leading-relaxed text-foreground">
        <p className="whitespace-pre-wrap">&ldquo;{report.report_summary}&rdquo;</p>
      </blockquote>

      {/* KPI grid */}
      {kpiItems.length > 0 && (
        <div className="px-5 pt-4">
          <div className="mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Key Results
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {kpiItems.map((kpi, i) => (
              <div
                key={i}
                className="rounded-lg border bg-background/60 p-3 backdrop-blur-sm"
              >
                {kpi.label && (
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                )}
                <div
                  className={`font-semibold tabular-nums ${
                    kpi.label ? "mt-0.5 text-lg" : "text-sm"
                  } ${highlightClass(kpi.value, kpi.label)}`}
                >
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata strip: period + scope */}
      {(report.pilot_date_range || report.deployment_scope) && (
        <div className="mt-4 grid gap-3 px-5 sm:grid-cols-2">
          {report.pilot_date_range && (
            <MetaCell icon={CalendarRange} label="Pilot period" value={report.pilot_date_range} />
          )}
          {report.deployment_scope && (
            <MetaCell icon={Users} label="Deployment scope" value={report.deployment_scope} />
          )}
        </div>
      )}

      {/* Evidence */}
      {report.evidence_notes && (
        <div className="mt-4 mx-5 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Evidence
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">
                {report.evidence_notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer attribution */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-5 py-2.5">
        <p className="text-xs text-muted-foreground">
          Submitted by <span className="font-medium text-foreground">{attribution}</span>
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">{formattedDate}</p>
      </div>
    </div>
  );
}

function MetaCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

// Best-effort KPI parser. Tries several delimiters and picks whichever splits
// the input into the most parts: bullets/newlines, semicolons/commas, and
// sentence boundaries (period + whitespace + capital). For each part, detects
// "label: value" by splitting on the FIRST colon. Trailing periods are
// stripped so values display cleanly.
function parseKpis(raw: string | null | undefined): { label: string | null; value: string }[] {
  if (!raw) return [];

  // Use a Unicode escape for the bullet so the source stays pure ASCII and
  // the regex can't silently match mojibake instead of the real character.
  const delimiters: RegExp[] = [
    /\s*[\n\u2022]\s*/,    // newlines or bullets
    /\s*;\s*/,             // semicolons
    /,\s*(?=[A-Z])/,       // comma + capital (avoid splitting "1,000")
    /\.\s+(?=[A-Z])/,      // sentence boundary: period + space + capital
  ];

  let parts: string[] = [raw.trim()];
  for (const delim of delimiters) {
    const candidate = raw
      .split(delim)
      .map((s) => s.trim())
      .filter(Boolean);
    if (candidate.length > parts.length) {
      parts = candidate;
    }
  }

  return parts.map((part) => {
    const cleaned = part.replace(/\.+$/, "").trim();
    const idx = cleaned.indexOf(":");
    if (idx > 0 && idx < cleaned.length - 1) {
      return {
        label: cleaned.slice(0, idx).trim(),
        value: cleaned.slice(idx + 1).trim(),
      };
    }
    return { label: null, value: cleaned };
  });
}

// Highlight a KPI value by direction (good vs bad). The direction depends on
// the metric: for "lower-is-better" metrics (cost, time, errors, churn) a drop
// is good; for "higher-is-better" metrics (revenue, NPS, CSAT, adoption) a
// drop is bad. Without a label we can't tell, so we stay neutral rather than
// risk presenting a regression as a success.
const GREEN = "text-green-700 dark:text-green-400";
const RED = "text-red-700 dark:text-red-400";

const LOWER_IS_BETTER =
  /\b(cost|spend|expense|price|time|duration|latency|delay|wait|error|bug|defect|incident|downtime|churn|attrition|complaint|risk|loss|waste|backlog|ttr|mttr|tta)\b/i;

const HIGHER_IS_BETTER =
  /\b(revenue|sales|profit|margin|arr|mrr|gmv|nps|csat|ces|adoption|conversion|retention|growth|engagement|satisfaction|throughput|efficiency|productivity|signups?|sign-?ups?|subscribers?|users?|customers?|leads?|installs?|downloads?|active|uptime|accuracy|recall|precision|score|rating|deliveries)\b/i;

function valueDirection(value: string): "up" | "down" | null {
  if (/(^|[^\d])-\s*\d/.test(value) || /\b(reduced|reduction|decreased?|down|fewer|less|drop(?:ped)?|cut|saved?|faster|shorter)\b/i.test(value)) {
    return "down";
  }
  if (/\+\s*\d/.test(value) || /\b(increased?|gained?|grew|growth|added|up|higher|more|boost(?:ed)?|improved?)\b/i.test(value)) {
    return "up";
  }
  return null;
}

function highlightClass(value: string, label: string | null): string {
  const direction = valueDirection(value);
  if (!direction || !label) return "";

  if (LOWER_IS_BETTER.test(label)) {
    return direction === "down" ? GREEN : RED;
  }
  if (HIGHER_IS_BETTER.test(label)) {
    return direction === "up" ? GREEN : RED;
  }
  return "";
}
