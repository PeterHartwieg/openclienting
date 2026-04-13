"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitSuccessReport } from "@/lib/actions/success-reports";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VerifiedOrg {
  membershipId: string;
  role: string;
  orgId: string;
  orgName: string;
}

interface AddSuccessReportFormProps {
  solutionApproachId: string;
  verifiedOrgs: VerifiedOrg[];
}

export function AddSuccessReportForm({ solutionApproachId, verifiedOrgs }: AddSuccessReportFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(verifiedOrgs[0]?.orgId ?? "");
  const [reportSummary, setReportSummary] = useState("");
  const [pilotDateRange, setPilotDateRange] = useState("");
  const [deploymentScope, setDeploymentScope] = useState("");
  const [kpiSummary, setKpiSummary] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [isPubliclyAnonymous, setIsPubliclyAnonymous] = useState(false);
  const [isOrgAnonymous, setIsOrgAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Report Success
      </Button>
    );
  }

  if (verifiedOrgs.length === 0) {
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-sm font-medium">Success reports require verified organization membership</p>
        <p className="text-xs text-muted-foreground">
          You must be an active member of a verified organization to submit a success report.
        </p>
        <div className="flex gap-2">
          <Link
            href="/dashboard/organizations"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Manage Organizations
          </Link>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitSuccessReport({
        solutionApproachId,
        organizationId: selectedOrgId,
        reportSummary,
        pilotDateRange: pilotDateRange || undefined,
        deploymentScope: deploymentScope || undefined,
        kpiSummary: kpiSummary || undefined,
        evidenceNotes: evidenceNotes || undefined,
        isPubliclyAnonymous,
        isOrgAnonymous,
      });
      if (result.success) {
        setReportSummary("");
        setPilotDateRange("");
        setDeploymentScope("");
        setKpiSummary("");
        setEvidenceNotes("");
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Submission failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <p className="text-sm font-medium">Report a Successful Pilot</p>

      {/* Organization selector */}
      <div className="space-y-1.5">
        <Label htmlFor="sr-org" className="text-sm">Reporting organization *</Label>
        {verifiedOrgs.length === 1 ? (
          <p className="text-sm text-muted-foreground">{verifiedOrgs[0].orgName}</p>
        ) : (
          <select
            id="sr-org"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            required
          >
            {verifiedOrgs.map((org) => (
              <option key={org.orgId} value={org.orgId}>{org.orgName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <Label htmlFor="sr-summary" className="text-sm">Summary *</Label>
        <Textarea
          id="sr-summary"
          value={reportSummary}
          onChange={(e) => setReportSummary(e.target.value)}
          placeholder="Describe the successful pilot — outcomes, context, results..."
          rows={3}
          required
        />
      </div>

      {/* Pilot date range */}
      <div className="space-y-1.5">
        <Label htmlFor="sr-dates" className="text-sm">Pilot date range</Label>
        <Input
          id="sr-dates"
          value={pilotDateRange}
          onChange={(e) => setPilotDateRange(e.target.value)}
          placeholder="e.g. Q1 2024 – Q3 2024"
        />
      </div>

      {/* Deployment scope */}
      <div className="space-y-1.5">
        <Label htmlFor="sr-scope" className="text-sm">Deployment scope</Label>
        <Input
          id="sr-scope"
          value={deploymentScope}
          onChange={(e) => setDeploymentScope(e.target.value)}
          placeholder="e.g. 3 departments, 200 users, 2 countries"
        />
      </div>

      {/* KPI summary */}
      <div className="space-y-1.5">
        <Label htmlFor="sr-kpi" className="text-sm">KPI summary</Label>
        <Textarea
          id="sr-kpi"
          value={kpiSummary}
          onChange={(e) => setKpiSummary(e.target.value)}
          placeholder="Key metrics and measurable outcomes..."
          rows={2}
        />
      </div>

      {/* Evidence notes */}
      <div className="space-y-1.5">
        <Label htmlFor="sr-evidence" className="text-sm">Evidence notes</Label>
        <Textarea
          id="sr-evidence"
          value={evidenceNotes}
          onChange={(e) => setEvidenceNotes(e.target.value)}
          placeholder="How was success measured? What evidence supports this report?"
          rows={2}
        />
      </div>

      {/* Anonymity controls */}
      <div className="space-y-2 rounded-md bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Public visibility</p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="sr-anon-person"
            checked={isPubliclyAnonymous}
            onCheckedChange={(c) => setIsPubliclyAnonymous(c === true)}
          />
          <Label htmlFor="sr-anon-person" className="text-sm">Hide my personal identity publicly</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="sr-anon-org"
            checked={isOrgAnonymous}
            onCheckedChange={(c) => setIsOrgAnonymous(c === true)}
          />
          <Label htmlFor="sr-anon-org" className="text-sm">Hide organization identity publicly</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Moderators always see the true attribution regardless of these settings.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit for review"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
