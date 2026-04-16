import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  FileText,
  FilePlus2,
  GitBranch,
  History,
  Home,
  Languages,
  Lightbulb,
  ListChecks,
  Pencil,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type NavMatch = "exact" | "startsWith";

export type NavRole = "contributor" | "moderator" | "admin";

export type NavBadge = { count: number } | null;

export type NavItem = {
  id: string;
  href: string;
  /** Translation key — resolved by the consuming client component. */
  labelKey: string;
  /** Fallback English label used when the translation key is missing. */
  labelFallback: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  match?: NavMatch;
  roles?: NavRole[];
  /** Visually emphasize as a primary CTA. */
  emphasize?: boolean;
};

export type NavGroup = {
  id: string;
  labelKey: string;
  labelFallback: string;
  items: NavItem[];
  roles?: NavRole[];
};

export type WorkspaceCounts = {
  unreadNotifications: number;
};

export type ModerationCounts = {
  problems: number;
  requirements: number;
  frameworks: number;
  solutions: number;
  successReports: number;
  suggestedEdits: number;
  organizationVerification: number;
  liveRevisions: number;
  knowledgeArticles: number;
  translations: number;
};

function stripLocale(pathname: string, locale: string): string {
  if (pathname === `/${locale}`) return "/";
  if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  return pathname;
}

export function isNavItemActive(
  pathname: string,
  item: Pick<NavItem, "href" | "match">,
  locale: string,
): boolean {
  const current = stripLocale(pathname, locale);
  const target = stripLocale(item.href, locale);
  if ((item.match ?? "startsWith") === "exact") {
    return current === target;
  }
  return current === target || current.startsWith(target + "/");
}

// -------------------------------------------------------------------------
// Public discovery shell — desktop header + mobile drawer
// -------------------------------------------------------------------------

export function publicNavItems(locale: string): NavItem[] {
  return [
    {
      id: "problems",
      href: `/${locale}/problems`,
      labelKey: "nav.problems",
      labelFallback: "Problems",
      match: "startsWith",
    },
    {
      id: "organizations",
      href: `/${locale}/organizations`,
      labelKey: "nav.organizations",
      labelFallback: "Organizations",
      match: "startsWith",
    },
    {
      id: "venture-clienting",
      href: `/${locale}/venture-clienting`,
      labelKey: "nav.ventureClienting",
      labelFallback: "Venture Clienting",
      match: "startsWith",
    },
  ];
}

export function publicCtaItem(locale: string): NavItem {
  return {
    id: "submit",
    href: `/${locale}/submit`,
    labelKey: "nav.submit",
    labelFallback: "Submit",
    icon: Send,
    match: "startsWith",
    emphasize: true,
  };
}

// -------------------------------------------------------------------------
// Workspace shell — sidebar + mobile drawer
// -------------------------------------------------------------------------

/**
 * True when the current pathname is inside the moderation workspace.
 * Used to decide whether to inject the per-queue items into the sidebar.
 */
export function isModerationPath(pathname: string, locale: string): boolean {
  const stripped = stripLocale(pathname, locale);
  return stripped === "/moderate" || stripped.startsWith("/moderate/");
}

export function workspaceNavGroups(
  locale: string,
  {
    role,
    counts,
    moderationCounts,
    pathname,
  }: {
    role: NavRole;
    counts: WorkspaceCounts;
    /**
     * When provided AND the user is moderator/admin AND `pathname` is under
     * `/moderate`, the Moderation group is expanded with one item per queue
     * carrying its current pending count as a badge. Outside that context,
     * the Moderation group keeps its short form (Overview / Tags / History).
     */
    moderationCounts?: ModerationCounts | null;
    pathname?: string | null;
  },
): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: "home",
      labelKey: "workspace.groups.home",
      labelFallback: "Home",
      items: [
        {
          id: "overview",
          href: `/${locale}/dashboard`,
          labelKey: "workspace.items.overview",
          labelFallback: "Overview",
          icon: Home,
          match: "exact",
          badge:
            counts.unreadNotifications > 0
              ? { count: counts.unreadNotifications }
              : null,
        },
      ],
    },
    {
      id: "organization",
      labelKey: "workspace.groups.organization",
      labelFallback: "Organizations",
      items: [
        {
          id: "orgs",
          href: `/${locale}/dashboard/organizations`,
          labelKey: "workspace.items.myOrgs",
          labelFallback: "My Organizations",
          icon: Building2,
          match: "exact",
        },
        {
          id: "orgs-join",
          href: `/${locale}/dashboard/organizations/join`,
          labelKey: "workspace.items.joinOrg",
          labelFallback: "Join Organization",
          icon: UserPlus,
          match: "startsWith",
        },
        {
          id: "orgs-new",
          href: `/${locale}/dashboard/organizations/new`,
          labelKey: "workspace.items.createOrg",
          labelFallback: "Create Organization",
          icon: PlusCircle,
          match: "startsWith",
        },
      ],
    },
    {
      id: "settings",
      labelKey: "workspace.groups.settings",
      labelFallback: "Settings",
      items: [
        {
          id: "account",
          href: `/${locale}/dashboard/account`,
          labelKey: "workspace.items.account",
          labelFallback: "Account",
          icon: User,
          match: "startsWith",
        },
      ],
    },
  ];

  if (role === "moderator" || role === "admin") {
    const showQueues =
      !!moderationCounts &&
      !!pathname &&
      isModerationPath(pathname, locale);

    const queueItems: NavItem[] = showQueues
      ? [
          {
            id: "moderation-problems",
            href: `/${locale}/moderate/problems`,
            labelKey: "workspace.items.moderationProblems",
            labelFallback: "Problems",
            icon: Lightbulb,
            // startsWith so /moderate/problems/[id] keeps Problems highlighted
            match: "startsWith",
            badge:
              moderationCounts.problems > 0
                ? { count: moderationCounts.problems }
                : null,
          },
          {
            id: "moderation-requirements",
            href: `/${locale}/moderate/requirements`,
            labelKey: "workspace.items.moderationRequirements",
            labelFallback: "Requirements",
            icon: ClipboardCheck,
            match: "exact",
            badge:
              moderationCounts.requirements > 0
                ? { count: moderationCounts.requirements }
                : null,
          },
          {
            id: "moderation-frameworks",
            href: `/${locale}/moderate/frameworks`,
            labelKey: "workspace.items.moderationFrameworks",
            labelFallback: "Frameworks",
            icon: Briefcase,
            match: "exact",
            badge:
              moderationCounts.frameworks > 0
                ? { count: moderationCounts.frameworks }
                : null,
          },
          {
            id: "moderation-solutions",
            href: `/${locale}/moderate/solutions`,
            labelKey: "workspace.items.moderationSolutions",
            labelFallback: "Solutions",
            icon: Sparkles,
            match: "exact",
            badge:
              moderationCounts.solutions > 0
                ? { count: moderationCounts.solutions }
                : null,
          },
          {
            id: "moderation-success-reports",
            href: `/${locale}/moderate/success-reports`,
            labelKey: "workspace.items.moderationSuccessReports",
            labelFallback: "Success Reports",
            icon: Trophy,
            match: "exact",
            badge:
              moderationCounts.successReports > 0
                ? { count: moderationCounts.successReports }
                : null,
          },
          {
            id: "moderation-suggested-edits",
            href: `/${locale}/moderate/suggested-edits`,
            labelKey: "workspace.items.moderationSuggestedEdits",
            labelFallback: "Suggested Edits",
            icon: Pencil,
            match: "exact",
            badge:
              moderationCounts.suggestedEdits > 0
                ? { count: moderationCounts.suggestedEdits }
                : null,
          },
          {
            id: "moderation-organization-verification",
            href: `/${locale}/moderate/organization-verification`,
            labelKey: "workspace.items.moderationOrganizationVerification",
            labelFallback: "Org Verification",
            icon: Building2,
            match: "exact",
            badge:
              moderationCounts.organizationVerification > 0
                ? { count: moderationCounts.organizationVerification }
                : null,
          },
          {
            id: "moderation-live-revisions",
            href: `/${locale}/moderate/live-revisions`,
            labelKey: "workspace.items.moderationLiveRevisions",
            labelFallback: "Live Revisions",
            icon: GitBranch,
            match: "exact",
            badge:
              moderationCounts.liveRevisions > 0
                ? { count: moderationCounts.liveRevisions }
                : null,
          },
          {
            id: "moderation-knowledge-articles",
            href: `/${locale}/moderate/knowledge-articles`,
            labelKey: "workspace.items.moderationKnowledgeArticles",
            labelFallback: "Knowledge Articles",
            icon: BookOpen,
            match: "exact",
            badge:
              moderationCounts.knowledgeArticles > 0
                ? { count: moderationCounts.knowledgeArticles }
                : null,
          },
          {
            id: "moderation-translations",
            href: `/${locale}/moderate/translations`,
            labelKey: "workspace.items.moderationTranslations",
            labelFallback: "Translations",
            icon: Languages,
            match: "exact",
            badge:
              moderationCounts.translations > 0
                ? { count: moderationCounts.translations }
                : null,
          },
        ]
      : [];

    groups.push({
      id: "moderation",
      labelKey: "workspace.groups.moderation",
      labelFallback: "Moderation",
      roles: ["moderator", "admin"],
      items: [
        {
          id: "moderation-overview",
          href: `/${locale}/moderate`,
          labelKey: "workspace.items.moderationOverview",
          labelFallback: "Moderation Queues",
          icon: ShieldCheck,
          match: "exact",
        },
        ...queueItems,
        {
          id: "moderation-tags",
          href: `/${locale}/moderate/tags`,
          labelKey: "workspace.items.moderationTags",
          labelFallback: "Tags",
          icon: ListChecks,
          match: "startsWith",
        },
        {
          id: "moderation-history",
          href: `/${locale}/moderate/history`,
          labelKey: "workspace.items.moderationHistory",
          labelFallback: "History",
          icon: History,
          match: "startsWith",
        },
      ],
    });
  }

  return groups;
}

// Unused but exported so future consumers can reference stable icons. Keeps
// this module the single source of truth for workspace iconography.
export const navIcons = {
  Bell,
  BookOpen,
  FileText,
  FilePlus2,
};
