import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import { getTagsGroupedByCategory } from "@/lib/queries/tags";
import { getUserVerifiedMemberships } from "@/lib/queries/organizations";
import { ProblemForm } from "@/components/submit/problem-form";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const [tagsByCategory, verifiedOrgs] = await Promise.all([
    getTagsGroupedByCategory(),
    getUserVerifiedMemberships(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Submit a Problem</h1>
      <p className="mt-2 text-muted-foreground">
        Describe a real challenge your organization faces. Include requirements
        and a pilot framework to help the community understand and address it.
      </p>

      <div className="mt-8">
        <ProblemForm tagsByCategory={tagsByCategory} locale={locale} verifiedOrgs={verifiedOrgs} />
      </div>
    </div>
  );
}
