import { redirect } from "next/navigation";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
      <p className="mt-2 text-muted-foreground">
        Register your organization to enable verified contributions.
      </p>
      <div className="mt-8">
        <CreateOrgForm locale={locale} />
      </div>
    </div>
  );
}
