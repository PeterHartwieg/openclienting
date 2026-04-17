"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackIaEvent, LOGIN_TS_KEY, pathnameToSection } from "@/lib/analytics/ia-events";

interface FirstLoginActionTrackerProps {
  locale: string;
}

export function FirstLoginActionTracker({ locale }: FirstLoginActionTrackerProps) {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (pathname === initialPathname.current) return;

    const rawTs = sessionStorage.getItem(LOGIN_TS_KEY);
    if (!rawTs) return;

    trackIaEvent({
      name: "ia_first_action_after_login",
      section: pathnameToSection(pathname, locale),
      ms_since_login: Date.now() - parseInt(rawTs, 10),
    });

    sessionStorage.removeItem(LOGIN_TS_KEY);
    fired.current = true;
  }, [pathname, locale]);

  return null;
}
