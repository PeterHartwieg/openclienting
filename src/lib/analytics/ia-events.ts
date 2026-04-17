// Consent key must match cookie-consent.tsx
const CONSENT_KEY = "oc_cookie_consent";

type StoredConsent = { version: number; analytics: boolean; timestamp: number };

function isAnalyticsConsented(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const c = JSON.parse(raw) as StoredConsent;
    return c.analytics === true;
  } catch {
    return false;
  }
}

export type IaShell = "public" | "workspace";
export type IaSurface = "header" | "sidebar" | "drawer";

export type DashboardCard =
  | "unread-notifications"
  | "pending-review"
  | "drafts"
  | "recent-orgs"
  | "recent-submissions"
  | "quick-action"
  | "moderator-queue-summary";

export type IaEvent =
  | {
      name: "ia_nav_click";
      section: string;
      shell: IaShell;
      surface: IaSurface;
    }
  | {
      name: "ia_first_action_after_login";
      section: string;
      ms_since_login: number;
    }
  | {
      name: "ia_dashboard_card_click";
      card: DashboardCard;
    }
  | {
      name: "ia_moderation_queue_open";
      queue: string;
    };

export function trackIaEvent(event: IaEvent): void {
  if (!isAnalyticsConsented()) return;
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: event.name, ...event });
}

/** Maps a NavItem.id to the `section` dimension used in ia_nav_click. */
export function navItemIdToSection(id: string): string {
  if (id === "overview") return "dashboard";
  if (id.startsWith("orgs")) return "organizations";
  if (id.startsWith("moderation")) return "moderate";
  return id; // problems, organizations, venture-clienting, submit, account
}

export const LOGIN_TS_KEY = "oc:login-ts";

/** Derives the ia_nav section from a pathname. */
export function pathnameToSection(pathname: string, locale: string): string {
  const withoutLocale = pathname.startsWith(`/${locale}/`)
    ? pathname.slice(locale.length + 2)
    : pathname.replace(/^\/[^/]+\//, "");
  const seg = withoutLocale.split("/")[0] ?? "";
  if (!seg) return "home";
  if (seg === "dashboard") {
    const sub = withoutLocale.split("/")[1] ?? "";
    if (sub === "account") return "account";
    if (sub === "organizations") return "organizations";
    return "dashboard";
  }
  if (seg === "moderate") return "moderate";
  return seg;
}
