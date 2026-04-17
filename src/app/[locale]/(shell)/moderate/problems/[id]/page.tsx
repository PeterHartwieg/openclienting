import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProblemById } from "@/lib/queries/problems";
import { TagBadge } from "@/components/shared/tag-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModerationActions } from "@/components/moderate/moderation-actions";
import { Separator } from "@/components/ui/separator";
import { getTagLabel } from "@/lib/i18n/tags";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "moderate" });
  return {
    title: `${t("tabProblems")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateProblemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");

  let problem;
  try {
    problem = await getProblemById(id);
  } catch {
    notFound();
  }
  if (!problem) notFound();

  const tags = (problem.problem_tags ?? [])
    .map(
      (pt: {
        tags: {
          id: string;
          name: string;
          name_de?: string | null;
          slug: string;
          category: string;
        } | null;
      }) => pt.tags,
    )
    .filter(Boolean);

  const personVisibility = problem.is_publicly_anonymous
    ? t("problem.visibilityHidden")
    : t("problem.visibilityVisible");
  const orgVisibility = problem.is_org_anonymous
    ? t("problem.visibilityHidden")
    : t("problem.visibilityVisible");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={problem.status} />
        <span className="text-sm text-muted-foreground">
          {problem.content_origin === "editorial_curated"
            ? `Editorial import · ${(problem.organizations as { name: string } | null)?.name ?? problem.packet_id ?? ""}`
            : t("byUser", {
                name: problem.profiles?.display_name ?? t("unknown"),
              })}
          {" — "}
          {t("problem.personVisibility", { visibility: personVisibility })}
          {", "}
          {t("problem.orgVisibility", { visibility: orgVisibility })}
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{problem.title}</h1>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(
            (tag: {
              id: string;
              name: string;
              name_de?: string | null;
              category: string;
            }) => (
              <TagBadge
                key={tag.id}
                name={getTagLabel(tag, locale)}
                category={tag.category}
              />
            ),
          )}
        </div>
      )}

      <Separator className="my-6" />

      <h2 className="text-xl font-semibold mb-2">{t("problem.description")}</h2>
      <p className="whitespace-pre-wrap text-sm">{problem.description}</p>

      <Separator className="my-6" />

      <h2 className="text-xl font-semibold mb-2">
        {t("problem.requirements", { count: (problem.requirements ?? []).length })}
      </h2>
      {(problem.requirements ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("problem.noneSubmitted")}</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {(problem.requirements ?? []).map((r: { id: string; body: string }) => (
            <li key={r.id} className="text-sm">{r.body}</li>
          ))}
        </ul>
      )}

      <Separator className="my-6" />

      <h2 className="text-xl font-semibold mb-2">
        {t("problem.pilotFrameworks", { count: (problem.pilot_frameworks ?? []).length })}
      </h2>
      {(problem.pilot_frameworks ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("problem.noneSubmitted")}</p>
      ) : (
        (problem.pilot_frameworks ?? []).map(
          (f: { id: string; scope: string | null; success_criteria: string | null }) => (
            <div key={f.id} className="text-sm space-y-1 mb-4">
              {f.scope && <p><strong>{t("problem.scope")}</strong> {f.scope}</p>}
              {f.success_criteria && (
                <p><strong>{t("problem.successCriteria")}</strong> {f.success_criteria}</p>
              )}
            </div>
          )
        )
      )}

      <Separator className="my-6" />

      <h2 className="text-xl font-semibold mb-4">{t("problem.actions")}</h2>
      <ModerationActions targetType="problem_templates" targetId={problem.id} />
    </div>
  );
}
