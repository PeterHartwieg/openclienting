import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { getVerifiedOrganizations } from "@/lib/queries/organizations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinOrgButton } from "@/components/dashboard/join-org-button";

export default async function JoinOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: "dashboard.orgPages.join" });
  const organizations = await getVerifiedOrganizations();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("subtitle")}
      </p>

      {organizations.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {t("emptyState")}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <JoinOrgButton organizationId={org.id} />
                </div>
              </CardHeader>
              {(org.website || org.description) && (
                <CardContent>
                  {org.website && (
                    <p className="text-sm text-muted-foreground">{org.website}</p>
                  )}
                  {org.description && (
                    <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
