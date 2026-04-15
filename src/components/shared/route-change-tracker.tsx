"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Pushes a `page_view` event to window.dataLayer on every client-side
 * navigation, including the initial page load.
 *
 * Why this is needed: GTM only injects its script once (after consent), so
 * the built-in "All Pages" trigger only fires for the very first hard load
 * that GTM is present for. All subsequent Next.js route changes are
 * client-side and invisible to GTM without an explicit dataLayer push.
 *
 * GTM setup: create a GA4 Event tag that fires on the Custom Event
 * "page_view" and remove / disable the "All Pages" trigger from the GA4
 * Configuration tag to avoid double-counting.
 */
function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const pagePath = search ? `${pathname}?${search}` : pathname;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export function RouteChangeTracker() {
  return (
    <Suspense>
      <Tracker />
    </Suspense>
  );
}
