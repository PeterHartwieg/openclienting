"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackIaEvent } from "@/lib/analytics/ia-events";

export function ModerationQueueTracker() {
  const pathname = usePathname();
  const lastFired = useRef<string | null>(null);

  useEffect(() => {
    const segments = pathname.split("/");
    const modIdx = segments.indexOf("moderate");
    if (modIdx < 0) return;

    const queue = segments[modIdx + 1] ?? "";
    if (!queue) return; // /moderate overview page — not a queue

    if (lastFired.current === queue) return;
    lastFired.current = queue;

    trackIaEvent({ name: "ia_moderation_queue_open", queue });
  }, [pathname]);

  return null;
}
