"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "oc_cookie_consent";
const CONSENT_VERSION = 1;

type ConsentState = {
  version: number;
  analytics: boolean;
  timestamp: number;
};

function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
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

function setConsent(analytics: boolean) {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics,
    timestamp: Date.now(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
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
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setVisible(true);
    } else if (existing.analytics && gaId) {
      loadGA(gaId);
    }
  }, [gaId]);

  const handleAcceptAll = useCallback(() => {
    setConsent(true);
    if (gaId) loadGA(gaId);
    setVisible(false);
  }, [gaId]);

  const handleRejectAll = useCallback(() => {
    setConsent(false);
    removeGACookies();
    setVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    setConsent(analyticsChecked);
    if (analyticsChecked && gaId) {
      loadGA(gaId);
    } else {
      removeGACookies();
    }
    setVisible(false);
    setShowDetails(false);
  }, [analyticsChecked, gaId]);

  if (!visible) return null;

  return (
    <div
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
              <a
                href="/en/privacy#5-google-analytics"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Learn more
              </a>
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
  window.dispatchEvent(new Event("oc-reopen-consent"));
}

/** Wrapper that listens for reopen events */
export function CookieConsentWrapper() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = () => setKey((k) => k + 1);
    window.addEventListener("oc-reopen-consent", handler);
    return () => window.removeEventListener("oc-reopen-consent", handler);
  }, []);

  return <CookieConsent key={key} />;
}
