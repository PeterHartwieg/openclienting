import {
  CalendarDays,
  Building2,
  User,
  FileText,
  Beaker,
  Lightbulb,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TagBadge } from "@/components/shared/tag-badge";
import { SolutionStatusBadge } from "@/components/shared/solution-status-badge";
import { getTagLabel } from "@/lib/i18n/tags";
import { formatDate } from "@/lib/i18n/format";

interface Tag {
  id: string;
  name: string;
  name_de?: string | null;
  category: string;
}

interface ProblemHeroProps {
  title: string;
  status: string;
  authorName: string;
  orgName: string | null;
  createdAt: string;
  tags: Tag[];
  locale: string;
  stats: {
    requirements: number;
    frameworks: number;
    approaches: number;
    successfulPilots: number;
    discussions: number;
  };
}

export async function ProblemHero({
  title,
  status,
  authorName,
  orgName,
  createdAt,
  tags,
  locale,
  stats,
}: ProblemHeroProps) {
  const t = await getTranslations({ locale, namespace: "problemDetail" });
  const formattedDate = formatDate(createdAt, locale, "long");

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.06] via-background to-background p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <SolutionStatusBadge status={status} />

      <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-balance">
        {title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <User className="h-4 w-4" />
          {authorName}
        </span>
        {orgName && (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {orgName}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4" />
          {formattedDate}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={getTagLabel(tag, locale)}
              category={tag.category}
            />
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatPill icon={FileText} label={t("statRequirements")} value={stats.requirements} accent="blue" />
        <StatPill icon={Beaker} label={t("statFrameworks")} value={stats.frameworks} accent="violet" />
        <StatPill icon={Lightbulb} label={t("statApproaches")} value={stats.approaches} accent="amber" />
        <StatPill icon={CheckCircle2} label={t("statSuccessfulPilots")} value={stats.successfulPilots} accent="green" />
        <StatPill icon={MessageCircle} label={t("statComments")} value={stats.discussions} accent="slate" />
      </div>
    </div>
  );
}

const accentClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400" },
};

function StatPill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: keyof typeof accentClasses;
}) {
  const c = accentClasses[accent];
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card/50 backdrop-blur-sm p-3">
      <div className={`rounded-md p-2 ${c.bg}`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
