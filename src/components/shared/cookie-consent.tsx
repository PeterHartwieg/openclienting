"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// Locales the app actively serves. Keep in sync with src/middleware.ts. If the
// path's first segment matches one of these we use it; otherwise we fall back
// to "en" so the privacy link doesn't force users out of their current locale.
const SUPPORTED_LOCALES = ["en"] as const;
const DEFAULT_LOCALE = "en";

function useCurrentLocale(): string {
  const pathname = usePathname();
  const segment = pathname?.split("/")[1] ?? "";
  return (SUPPORTED_LOCALES as readonly string[]).includes(segment)
    ? segment
    : DEFAULT_LOCALE;
}

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

/** Load GA4 script dynamically — only called after consent */
function loadGA(measurementId: string) {
  if (document.querySelector(`script[src*="gtag"]`)) return;

  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", measurementId, {
    anonymize_ip: true,
  });
}

/** Remove GA cookies when consent is withdrawn */
function removeGACookies() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const name = cookie.split("=")[0].trim();
    if (name.startsWith("_ga") || name.startsWith("_gid")) {
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
  const locale = useCurrentLocale();

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Load GA whenever the stored consent allows it. The effect mutates the DOM
  // (script tag injection) but doesn't touch React state, so the React 19
  // set-state-in-effect rule is satisfied.
  useEffect(() => {
    if (!isSSR && consent?.analytics && gaId) {
      loadGA(gaId);
    }
  }, [isSSR, consent?.analytics, gaId]);

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
    if (gaId) loadGA(gaId);
    // No setVisible — writeConsent dispatches CONSENT_EVENT, which the
    // useSyncExternalStore subscription picks up and hides the banner.
  }, [gaId]);

  const handleRejectAll = useCallback(() => {
    writeConsent(false);
    removeGACookies();
  }, []);

  const handleSavePreferences = useCallback(() => {
    writeConsent(analyticsChecked);
    if (analyticsChecked && gaId) {
      loadGA(gaId);
    } else {
      removeGACookies();
    }
    setShowDetails(false);
  }, [analyticsChecked, gaId]);

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto max-w-4xl">
        {!showDetails ? (
          <>
            <p className="text-sm leading-relaxed text-foreground/90">
              We use cookies to keep you logged in (strictly necessary) and, with
              your consent, Google Analytics to understand how the site is used.
              You can change your preferences at any time via &ldquo;Cookie
              Settings&rdquo; in the footer.{" "}
              <Link
                href={`/${locale}/privacy#5-google-analytics`}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Learn more
              </Link>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleAcceptAll}>Accept all</Button>
              <Button variant="outline" onClick={handleRejectAll}>
                Reject all
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(true)}
                className="text-muted-foreground"
              >
                Manage preferences
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm font-semibold">Cookie preferences</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <div>
                  <p className="text-sm font-medium">
                    Strictly necessary
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Authentication cookies required for the platform to function.
                    Cannot be disabled.
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
                  <p className="text-sm font-medium">
                    Analytics (Google Analytics)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Help us understand how visitors use the site. Data is
                    anonymised and sent to Google. Cookies: _ga, _gid (retention:
                    up to 2 months).
                  </p>
                </div>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={handleSavePreferences}>Save preferences</Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="text-muted-foreground"
              >
                Back
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
