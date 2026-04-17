"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackIaEvent, type DashboardCard } from "@/lib/analytics/ia-events";

interface TrackedCardLinkProps extends ComponentProps<typeof Link> {
  card: DashboardCard;
}

export function TrackedCardLink({ card, onClick, ...props }: TrackedCardLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackIaEvent({ name: "ia_dashboard_card_click", card });
        onClick?.(e);
      }}
    />
  );
}
