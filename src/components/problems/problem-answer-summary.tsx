import { Quote, Users, CheckSquare, Beaker, CircleDot } from "lucide-react";
import { SolutionStatusBadge } from "@/components/shared/solution-status-badge";
import { answerSummaryFields } from "@/lib/seo/answer-summary";

interface ProblemAnswerSummaryProps {
  // Accept the shape `answerSummaryFields` needs — the full problem row is a
  // superset so `getProblemById`'s return value satisfies this without any
  // shape coercion at the call site.
  problem: Parameters<typeof answerSummaryFields>[0] & {
    solution_status: string | null;
  };
  locale: string;
}

/**
 * Answer-ready summary block shown above the ProblemHero on problem detail
 * pages. This block is the citation target for AI answer engines — every
 * field rendered here is the authoritative source for the equivalent
 * `<meta description>` and Article JSON-LD `description` / `keywords`.
 *
 * The derivation lives in `src/lib/seo/answer-summary.ts` so both this
 * component and the Markdown route (PR 2) share one code path.
 */
export async function ProblemAnswerSummary({ problem, locale }: ProblemAnswerSummaryProps) {
  const fields = await answerSummaryFields(problem, locale);

  return (
    <section
      aria-label={fields.summaryLabel}
      className="mb-6 rounded-xl border bg-muted/30 p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryRow
          icon={Quote}
          label={fields.summaryLabel}
          value={fields.summary}
          fullWidth
        />
        {fields.whoThisAffects && (
          <SummaryRow
            icon={Users}
            label={fields.whoThisAffectsLabel}
            value={fields.whoThisAffects}
          />
        )}
        <SummaryRow
          icon={CheckSquare}
          label={fields.knownRequirementsLabel}
          value={fields.knownRequirements}
        />
        <SummaryRow
          icon={Beaker}
          label={fields.pilotEvidenceLabel}
          value={fields.pilotEvidence}
        />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-md bg-background p-1.5">
            <CircleDot className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {/* Reuse existing status string — already rendered visibly. */}
              Status
            </div>
            <div className="mt-1">
              <SolutionStatusBadge status={problem.solution_status ?? "unsolved"} />
              <span className="ml-2 text-sm text-muted-foreground">
                {fields.solutionStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  fullWidth = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <div className="mt-0.5 shrink-0 rounded-md bg-background p-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-sm leading-relaxed text-foreground">{value}</div>
      </div>
    </div>
  );
}
