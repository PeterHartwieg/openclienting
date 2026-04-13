import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import { getOrganizationWithMembers } from "@/lib/queries/organizations";
import { getOrgSizeTier } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RequestVerificationButton } from "@/components/dashboard/request-verification-button";
import { LeaveOrgButton } from "@/components/dashboard/leave-org-button";
import { OrgLogoUpload } from "@/components/dashboard/org-logo-upload";
import { EditOrgForm } from "@/components/dashboard/edit-org-form";

const verificationColors: Record<string, string> = {
  unverified: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const tierColors: Record<string, string> = {
  Micro: "bg-blue-100 text-blue-800",
  Small: "bg-indigo-100 text-indigo-800",
  Medium: "bg-purple-100 text-purple-800",
  Large: "bg-orange-100 text-orange-800",
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  let orgData;
  try {
    orgData = await getOrganizationWithMembers(id);
  } catch {
    notFound();
  }

  const { org, members } = orgData;
  const currentMembership = members.find((m) => m.user_id === user.id);
  const isAdmin = currentMembership?.role === "admin";
  const isCreator = org.created_by === user.id;
  const sizeTier = getOrgSizeTier(org.employee_count);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={`${org.name} logo`}
              className="h-16 w-16 rounded-lg object-cover border shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold shrink-0">
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {org.website && <span>{org.website}</span>}
              {org.employee_count != null && (
                <span>
                  {org.website && " · "}
                  {org.employee_count.toLocaleString()} employees
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sizeTier && (
            <Badge className={cn("text-sm", tierColors[sizeTier])}>
              {sizeTier}
            </Badge>
          )}
          <Badge className={cn("capitalize text-sm", verificationColors[org.verification_status])}>
            {org.verification_status}
          </Badge>
        </div>
      </div>

      {org.description && (
        <p className="mt-4 text-muted-foreground">{org.description}</p>
      )}

      <div className="mt-6 flex gap-3">
        {isCreator && org.verification_status === "unverified" && (
          <RequestVerificationButton organizationId={org.id} />
        )}
        {currentMembership && currentMembership.membership_status === "active" && (
          <LeaveOrgButton organizationId={org.id} locale={locale} />
        )}
      </div>

      {/* Admin section: logo upload + edit form */}
      {isAdmin && (
        <>
          <div className="mt-10">
            <h2 className="text-xl font-semibold">Logo</h2>
            <div className="mt-4">
              <OrgLogoUpload
                organizationId={org.id}
                currentLogoUrl={org.logo_url}
              />
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold">Edit Organization</h2>
            <div className="mt-4">
              <EditOrgForm
                organizationId={org.id}
                initialValues={{
                  name: org.name,
                  website: org.website,
                  description: org.description,
                  employeeCount: org.employee_count,
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Members list — visible to org admins */}
      {isAdmin && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold">Members</h2>
          <div className="mt-4 space-y-2">
            {members.length === 0 ? (
              <p className="text-muted-foreground">No members.</p>
            ) : (
              members.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {(m.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">
                          {m.role}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize text-xs",
                            m.membership_status === "active" && "text-green-700",
                            m.membership_status === "pending" && "text-yellow-700"
                          )}
                        >
                          {m.membership_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
