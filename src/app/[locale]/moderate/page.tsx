import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModerationActions } from "@/components/moderate/moderation-actions";
import { SuggestedEditReview } from "@/components/moderate/suggested-edit-review";
import { VerificationActions } from "@/components/moderate/verification-actions";
import { SuccessReportReview } from "@/components/moderate/success-report-review";
import { getPendingVerifications, getPendingMemberships } from "@/lib/queries/organizations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  try {
    await requireRole("moderator");
  } catch {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();

  const [{ data: problems }, { data: requirements }, { data: frameworks }, { data: approaches }, { data: successReports }, { data: suggestedEdits }, pendingOrgs, pendingMemberships] =
    await Promise.all([
      supabase
        .from("problem_templates")
        .select("id, title, status, created_at, profiles!problem_templates_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("requirements")
        .select("id, body, status, created_at, problem_id, profiles!requirements_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("pilot_frameworks")
        .select("id, scope, status, created_at, problem_id, profiles!pilot_frameworks_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("solution_approaches")
        .select("id, title, status, created_at, problem_id, profiles!solution_approaches_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("success_reports")
        .select(`
          id, report_summary, pilot_date_range, deployment_scope, kpi_summary, evidence_notes,
          status, verification_status, created_at, solution_approach_id,
          is_publicly_anonymous, is_org_anonymous,
          profiles!success_reports_author_id_fkey (display_name),
          organizations!success_reports_submitted_by_organization_id_fkey (id, name)
        `)
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("suggested_edits")
        .select("id, target_type, target_id, diff, status, created_at, profiles!suggested_edits_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      getPendingVerifications(),
      getPendingMemberships(),
    ]);

  const problemCount = problems?.length ?? 0;
  const reqCount = requirements?.length ?? 0;
  const fwCount = frameworks?.length ?? 0;
  const saCount = approaches?.length ?? 0;
  const srCount = successReports?.length ?? 0;
  const seCount = suggestedEdits?.length ?? 0;
  const orgVerifCount = pendingOrgs.length;
  const memberVerifCount = pendingMemberships.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/moderate/history`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit History
          </Link>
          <Link
            href={`/${locale}/moderate/tags`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Manage Tags
          </Link>
        </div>
      </div>

      <Tabs defaultValue="problems" className="mt-8">
        <TabsList>
          <TabsTrigger value="problems">
            Problems ({problemCount})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements ({reqCount})
          </TabsTrigger>
          <TabsTrigger value="frameworks">
            Frameworks ({fwCount})
          </TabsTrigger>
          <TabsTrigger value="solutions">
            Solutions ({saCount})
          </TabsTrigger>
          <TabsTrigger value="success-reports">
            Success Reports ({srCount})
          </TabsTrigger>
          <TabsTrigger value="suggested-edits">
            Edits ({seCount})
          </TabsTrigger>
          <TabsTrigger value="org-verification">
            Org Verification ({orgVerifCount})
          </TabsTrigger>
          <TabsTrigger value="memberships">
            Memberships ({memberVerifCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-4 space-y-3">
          {problemCount === 0 ? (
            <p className="text-muted-foreground">No pending problems.</p>
          ) : (
            problems!.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/${locale}/moderate/problems/${p.id}`}>
                      <CardTitle className="text-base hover:underline">
                        {p.title}
                      </CardTitle>
                    </Link>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {(p.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="problem_templates"
                    targetId={p.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="requirements" className="mt-4 space-y-3">
          {reqCount === 0 ? (
            <p className="text-muted-foreground">No pending requirements.</p>
          ) : (
            requirements!.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {r.body.length > 100 ? r.body.slice(0, 100) + "..." : r.body}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    by {(r.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="requirements"
                    targetId={r.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="frameworks" className="mt-4 space-y-3">
          {fwCount === 0 ? (
            <p className="text-muted-foreground">No pending frameworks.</p>
          ) : (
            frameworks!.map((f) => (
              <Card key={f.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {f.scope
                      ? f.scope.length > 100
                        ? f.scope.slice(0, 100) + "..."
                        : f.scope
                      : "Pilot Framework"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    by {(f.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(f.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="pilot_frameworks"
                    targetId={f.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="solutions" className="mt-4 space-y-3">
          {saCount === 0 ? (
            <p className="text-muted-foreground">No pending solution approaches.</p>
          ) : (
            approaches!.map((sa) => (
              <Card key={sa.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{sa.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    by {(sa.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(sa.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="solution_approaches"
                    targetId={sa.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="success-reports" className="mt-4 space-y-3">
          {srCount === 0 ? (
            <p className="text-muted-foreground">No pending success reports.</p>
          ) : (
            successReports!.map((sr) => {
              const profiles = sr.profiles as unknown as { display_name: string | null } | null;
              const org = sr.organizations as unknown as { id: string; name: string } | null;
              return (
                <Card key={sr.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-sm font-medium">
                        Success report · {new Date(sr.created_at).toLocaleDateString()}
                      </CardTitle>
                      <StatusBadge status={sr.verification_status ?? sr.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SuccessReportReview
                      reportId={sr.id}
                      reportSummary={sr.report_summary}
                      pilotDateRange={(sr as unknown as { pilot_date_range?: string | null }).pilot_date_range}
                      deploymentScope={(sr as unknown as { deployment_scope?: string | null }).deployment_scope}
                      kpiSummary={(sr as unknown as { kpi_summary?: string | null }).kpi_summary}
                      evidenceNotes={(sr as unknown as { evidence_notes?: string | null }).evidence_notes}
                      submitterName={profiles?.display_name ?? null}
                      organizationName={org?.name ?? null}
                      isPubliclyAnonymous={(sr as unknown as { is_publicly_anonymous: boolean }).is_publicly_anonymous}
                      isOrgAnonymous={(sr as unknown as { is_org_anonymous: boolean }).is_org_anonymous}
                      verificationStatus={sr.verification_status ?? "submitted"}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="suggested-edits" className="mt-4 space-y-3">
          {seCount === 0 ? (
            <p className="text-muted-foreground">No pending suggested edits.</p>
          ) : (
            suggestedEdits!.map((se) => (
              <Card key={se.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{se.target_type}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{se.target_id.slice(0, 8)}...</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {(se.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(se.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <SuggestedEditReview
                    editId={se.id}
                    diff={se.diff as Record<string, { old: string | null; new: string | null }>}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="org-verification" className="mt-4 space-y-3">
          {orgVerifCount === 0 ? (
            <p className="text-muted-foreground">No pending organization verifications.</p>
          ) : (
            pendingOrgs.map((org) => (
              <Card key={org.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {org.website && (
                      <>
                        <a
                          href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          {org.website}
                        </a>
                        {" · "}
                      </>
                    )}
                    by {(org.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(org.created_at).toLocaleDateString()}
                  </p>
                  {org.description && (
                    <p className="text-sm text-muted-foreground mt-1">{org.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs space-y-1.5">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide mb-2">Verification checklist</p>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 shrink-0" />
                      <span>Website is reachable and represents a real organization</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 shrink-0" />
                      <span>Organization name matches the website / public registration</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 shrink-0" />
                      <span>Requester appears plausibly connected (email domain, LinkedIn, etc.)</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 shrink-0" />
                      <span>Organization is a genuine business entity, not a personal project</span>
                    </label>
                  </div>
                  <VerificationActions
                    targetType="organization"
                    targetId={org.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="memberships" className="mt-4 space-y-3">
          {memberVerifCount === 0 ? (
            <p className="text-muted-foreground">No pending membership requests.</p>
          ) : (
            pendingMemberships.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {(m.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    wants to join{" "}
                    {(m.organizations as unknown as { name: string } | null)?.name ?? "Unknown org"} ·{" "}
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <VerificationActions
                    targetType="membership"
                    targetId={m.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
