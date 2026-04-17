import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { CreateOrgForm } from "@/components/dashboard/create-org-form";

export default async function NewOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: "dashboard.orgPages.new" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("subtitle")}
      </p>
      <div className="mt-8">
        <CreateOrgForm locale={locale} />
      </div>
    </div>
  );
}
