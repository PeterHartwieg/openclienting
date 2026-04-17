"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRecentNavTracker } from "@/lib/hooks/use-recent-nav";

interface RecentNavTrackerProps {
  locale: string;
}

/**
 * Invisible client component mounted in WorkspaceShell to record workspace
 * navigation history. Renders nothing; side-effect only.
 */
export function RecentNavTracker({ locale }: RecentNavTrackerProps) {
  const t = useTranslations("workspace");

  const deriveLabel = useCallback(
    (pathname: string): string | null => {
      // Strip locale prefix
      const stripped =
        pathname === `/${locale}`
          ? "/"
          : pathname.startsWith(`/${locale}/`)
          ? pathname.slice(locale.length + 2)
          : pathname;

      // Exclusions
      if (stripped === "/" || stripped === "") return null;
      if (stripped.startsWith("auth/")) return null;
      if (stripped.startsWith("submit/success")) return null;

      // Known workspace routes → label
      if (stripped === "dashboard") return t("items.overview");
      if (stripped === "dashboard/notifications")
        return t("items.notifications");
      if (stripped === "dashboard/organizations") return t("items.myOrgs");
      if (stripped.startsWith("dashboard/organizations/join"))
        return t("items.joinOrg");
      if (stripped.startsWith("dashboard/organizations/new"))
        return t("items.createOrg");
      if (stripped.startsWith("dashboard/organizations/"))
        return t("items.myOrgs");
      if (stripped.startsWith("dashboard/account")) return t("items.account");
      if (stripped === "moderate") return t("items.moderationOverview");
      if (stripped.startsWith("moderate/problems"))
        return t("items.moderationProblems");
      if (stripped.startsWith("moderate/requirements"))
        return t("items.moderationRequirements");
      if (stripped.startsWith("moderate/frameworks"))
        return t("items.moderationFrameworks");
      if (stripped.startsWith("moderate/solutions"))
        return t("items.moderationSolutions");
      if (stripped.startsWith("moderate/success-reports"))
        return t("items.moderationSuccessReports");
      if (stripped.startsWith("moderate/suggested-edits"))
        return t("items.moderationSuggestedEdits");
      if (stripped.startsWith("moderate/organization-verification"))
        return t("items.moderationOrganizationVerification");
      if (stripped.startsWith("moderate/live-revisions"))
        return t("items.moderationLiveRevisions");
      if (stripped.startsWith("moderate/knowledge-articles"))
        return t("items.moderationKnowledgeArticles");
      if (stripped.startsWith("moderate/translations"))
        return t("items.moderationTranslations");
      if (stripped.startsWith("moderate/tags"))
        return t("items.moderationTags");
      if (stripped.startsWith("moderate/history"))
        return t("items.moderationHistory");

      return null;
    },
    [locale, t],
  );

  useRecentNavTracker(deriveLabel);

  return null;
}
