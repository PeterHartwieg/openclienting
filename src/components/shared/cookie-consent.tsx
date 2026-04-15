"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "oc_cookie_consent";
const CONSENT_VERSION = 1;
// Sentinel returned by the server snapshot. We can't read localStorage during
// SSR, and we also can't render the banner during hydration without causing a
// mismatch. The component treats this value as "don't render anything yet".
const SSR_SNAPSHOT = "__ssr__";
// Custom event so writes from the same tab trigger re-renders. The native
// "storage" event only fires for *other* tabs.
const CONSENT_EVENT = "oc-consent-changed";

type ConsentState = {
  version: number;
  analytics: boolean;
  timestamp: number;
};

function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    // Re-prompt after 6 months
    const sixMonths = 1000 * 60 * 60 * 24 * 180;
    if (Date.now() - parsed.timestamp > sixMonths) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(analytics: boolean) {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics,
    timestamp: Date.now(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

// useSyncExternalStore wiring. Returns the raw localStorage string (or the
// SSR sentinel) so React's snapshot equality stays primitive-cheap.
function subscribeConsent(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function getConsentSnapshot(): string {
  return localStorage.getItem(CONSENT_KEY) ?? "";
}

function getServerConsentSnapshot(): string {
  return SSR_SNAPSHOT;
}

/**
 * Load Google Tag Manager — only called after consent. GA4 is configured as a
 * tag inside the GTM container; there is no separate gtag.js loader.
 */
function loadGTM(containerId: string) {
  if (document.querySelector(`script[src*="gtm.js"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  });

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  script.async = true;
  document.head.appendChild(script);
}

/** Remove GA / GTM cookies when consent is withdrawn */
function removeAnalyticsCookies() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    if (
      name.startsWith("_ga") ||
      name.startsWith("_gid") ||
      name.startsWith("_gcl_")
    ) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    }
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function CookieConsent() {
  // Subscribe to the consent value in localStorage. During SSR/hydration this
  // returns the SSR sentinel so we render nothing — no hydration mismatch and,
  // crucially, no setState-in-effect needed to flip a "mounted" or "visible"
  // flag. Re-renders happen automatically when consent is written or cleared.
  const rawConsent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const isSSR = rawConsent === SSR_SNAPSHOT;
  const consent = isSSR ? null : parseConsent(rawConsent || null);
  const visible = !isSSR && consent === null;

  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const t = useTranslations("consent");
  const tCommon = useTranslations("common");

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  // Load GTM whenever the stored consent allows it. The effect mutates the
  // DOM (script tag injection) but doesn't touch React state, so the React 19
  // set-state-in-effect rule is satisfied.
  useEffect(() => {
    if (isSSR || !consent?.analytics) return;
    if (gtmId) loadGTM(gtmId);
  }, [isSSR, consent?.analytics, gtmId]);

  // Reserve space at the bottom of the page so the fixed banner doesn't
  // overlay the footer. Tracks the dialog's actual height (which changes
  // when the user expands "Manage preferences" or resizes the viewport).
  useEffect(() => {
    if (!visible) {
      document.body.style.paddingBottom = "";
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) return;

    const update = () => {
      document.body.style.paddingBottom = `${dialog.offsetHeight}px`;
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(dialog);
    return () => {
      ro.disconnect();
      document.body.style.paddingBottom = "";
    };
  }, [visible, showDetails]);

  const handleAcceptAll = useCallback(() => {
    writeConsent(true);
    if (gtmId) loadGTM(gtmId);
  }, [gtmId]);

  const handleRejectAll = useCallback(() => {
    writeConsent(false);
    removeAnalyticsCookies();
  }, []);

  const handleSavePreferences = useCallback(() => {
    writeConsent(analyticsChecked);
    if (analyticsChecked) {
      if (gtmId) loadGTM(gtmId);
    } else {
      removeAnalyticsCookies();
    }
    setShowDetails(false);
  }, [analyticsChecked, gtmId]);

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto max-w-4xl">
        {!showDetails ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">
              {t("body")}{" "}
              <Link
                href={`/${locale}/privacy#5-google-analytics`}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {t("learnMore")}
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleAcceptAll}>{t("accept")}</Button>
              <Button variant="outline" onClick={handleRejectAll}>
                {t("decline")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(true)}
                className="text-muted-foreground"
              >
                {t("settings")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold">{t("settings")}</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <div>
                  <p className="text-sm font-medium">{t("necessaryTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("necessaryDescription")}
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsChecked}
                  onChange={(e) => setAnalyticsChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <div>
                  <p className="text-sm font-medium">{t("analyticsTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("analyticsDescription")}
                  </p>
                </div>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleSavePreferences}>{tCommon("save")}</Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground"
              >
                {tCommon("back")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Re-open cookie consent — used by footer "Cookie Settings" link */
export function openCookieSettings() {
  localStorage.removeItem(CONSENT_KEY);
  // Same custom event the writers fire so the useSyncExternalStore subscription
  // re-reads localStorage and brings the banner back without a key remount.
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/**
 * Kept as a named export for backwards compatibility with imports in the root
 * layout. The previous implementation wrapped the consent banner in a
 * key-resetting parent so a "reopen" event would force a fresh mount; with
 * useSyncExternalStore the subscription picks up the reset on its own and the
 * wrapper can just forward to the component.
 */
export function CookieConsentWrapper() {
  return <CookieConsent />;
}
