import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { getUserOrganizations } from "@/lib/queries/organizations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn, getOrgSizeTier } from "@/lib/utils";

const verificationColors: Record<string, string> = {
  unverified: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: "dashboard.orgPages.list" });
  const memberships = await getUserOrganizations(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/dashboard/organizations/join`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("joinButton")}
          </Link>
          <Link
            href={`/${locale}/dashboard/organizations/new`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {t("createButton")}
          </Link>
        </div>
      </div>

      {memberships.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {t("emptyState")}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {memberships.map((m) => {
            const org = m.organizations as unknown as {
              id: string;
              name: string;
              logo_url: string | null;
              employee_count: number | null;
              verification_status: string;
              created_by: string;
            };
            const tier = getOrgSizeTier(org.employee_count);
            return (
              <Link key={m.id} href={`/${locale}/dashboard/organizations/${org.id}`}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {org.logo_url ? (
                          <Image
                            src={org.logo_url}
                            alt=""
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded object-cover border shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <CardTitle className="text-base">{org.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {tier && (
                          <Badge variant="outline" className="text-xs">
                            {tier}
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {m.role}
                        </Badge>
                        <Badge
                          className={cn(
                            "capitalize",
                            verificationColors[org.verification_status],
                          )}
                        >
                          {org.verification_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {m.membership_status === "pending"
                        ? "Membership pending approval"
                        : "Active member"}
                      {org.employee_count != null &&
                        ` - ${org.employee_count.toLocaleString()} employees`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
